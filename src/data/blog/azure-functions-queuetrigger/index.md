---
title: Azure Functions - Queue Trigger - VisibilityTimeout
description: Azure Funtions 의 Queue Trigger 의 처리 원리
pubDatetime: 2026-06-02T11:00:00+09:00 
category: cloud  
draft: false  
tags:
  - Azure Functions
  - Queue Trigger
---

## Intro
Queue 트리거는, 지정된 큐에서 메시지를 취득해서 실행하는 함수이다. 함수 처리가 시작되면, 큐에 저장된 메시지를 lock 하고, 처리가 성공한 경우에는 메시지를 삭제, 실패한 경우는 메시지를 큐에 되돌리거나, maximum dequeue count 가 초과된 경우, poison queue 에 넣는다.

## Lock 원리 - VisibilityTimeout
- 복수의 인스턴스가 동시에 큐의 메시지를 처리하지 않도록 하기 위해 Lock 이 필요하다.
- 다만, Queue 메시지 자체에 Lock 기능은 없다. 대신, 메시지마다 가시(Visible) / 비가시(Invisible) 상태를 전환하는 것으로 lock 을 실현한다. 즉, 메시지를 Invisible 상태로 만들어 다른 클라이언트가 동일한 메시지를 가져갈 수 없도록 한다.
- 이는 Azure Storage Queue 가 제공하는 기능이며, Azure Functions 만의 기능은 아니다.
- 동작방식
   1. Queue 트리거가 새로운 메시지를 처리할 때, 기반 클래스의 [GetMessagesAsync](https://github.com/Azure/azure-webjobs-sdk/blob/863f835059ce0f27b5e7e662c00f9887d640e5bc/src/Microsoft.Azure.WebJobs.Extensions.Storage/Queues/Listeners/QueueListener.cs#L204) 메서드가 호출된다.
   2. 이때 메서드의 parameter 값으로 전달되는 `visibilityTimeout` 가 메시지를 비가시 상태로 유지하는 시간이다.
   ```csharp
    batch = await TimeoutHandler.ExecuteWithTimeout(nameof(CloudQueue.GetMessageAsync), context.ClientRequestID,
    _exceptionHandler, _logger, cancellationToken, () =>
    {
        return _queue.GetMessagesAsync(_queueProcessor.BatchSize,
            _visibilityTimeout,
            options: DefaultQueueRequestOptions,
            operationContext: context,
            cancellationToken: cancellationToken);
    });
   ```
   3. `_visibilityTimeout` 은 host.json 설정값과 관계없이, 10분으로 고정되어 있다. 즉, 10분마다 비가시상태를 계속 갱신함으로, 동일한 Queue 메시지가 Azure FUnctions 의 하나의 인스턴스에서만 처리되도록 보장한다.

## Queue 트리거 처리 종료 시 동작
```csharp
  public virtual async Task CompleteProcessingMessageAsync(CloudQueueMessage message, FunctionResult result, CancellationToken cancellationToken)
  {
      if (result.Succeeded)
      {
          await DeleteMessageAsync(message, cancellationToken);
      }
      else if (_poisonQueue != null)
      {
          if (message.DequeueCount >= MaxDequeueCount)
          {
              await HandlePoisonMessageAsync(message, cancellationToken);
          }
          else
          {
              await ReleaseMessageAsync(message, result, VisibilityTimeout, cancellationToken);
          }
      }
      else
      {
          // For queues without a corresponding poison queue, leave the message invisible when processing
          // fails to prevent a fast infinite loop.
          // Specifically, don't call ReleaseMessage(message)
      }
  }
```

1. 일단 처리가 시작되면 Queue 트리거가 처리 종료 시 [CompleteProcessingMessageAsync](https://github.com/Azure/azure-webjobs-sdk/blob/3f4ec78be9f43bb041937425ced00b341883aa42/src/Microsoft.Azure.WebJobs.Extensions.Storage/Queues/QueueProcessor.cs#L99-L134)를 실행. 정상 종료한 경우, `DeleteMessageAsync` 가 호출되어 메시지는 삭제된다.
2. 이상 종료인 경우, DequeueCount 가 MaxDequeueCount 를 초과한 경우엔 Poison queue에, 그렇지 않은 경우, `ReleaseMessageAsync` 가 호출되어, `UpdateMessageAsync` 처리를 통해, Visibility 상태를 되돌린다. 이 때, host.json 에 설정한 visibilityTimeout 값이 Queue 메시지에 반영된다. 즉, 실패한 메시지가 host.json 에 설정한 시간만큼 지난 후에 다시 visible 상태가 되어 재처리 대상이 된다.
3. 한편, 어떤 분기에도 해당되지 않는 예외가 발생하는 경우, host.json 에 설정된 값이 아닌, 고정값 10분이 적용된다.

## Application Insights 의 traces 로그로 확인하는 방법
1. Executing -> Executed (failed) 의 패턴의 경우, 이상 종료한 것으로 host.json 에 설정한 시간이 적용되어 재시도된다.
`Executing -> Executed (failed) -> host.json 에 설정된 시간 뒤 -> Executing`
2. Executing -> (Executed 없음) 의 패턴의 경우, 어떤 분기도 해당하지 않는 예외가 발생한 것으로 고정값 10분 후에 재시도된다.
`Executing -> (Executed 없음) -> 10분 후 -> Executing`


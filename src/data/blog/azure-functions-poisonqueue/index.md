---
title: Azure Functions - Queue Trigger - Poison Queue
description: Azure Functions Queue Trigger 의 Poison Queue 와 DequeueCount 동작 원리
pubDatetime: 2026-06-02T21:00:00+09:00
category: cloud
draft: false
tags:
  - Azure Functions
  - Queue Trigger
  - Poison Queue
---

## Intro
Queue 트리거 함수에서 처리에 계속 실패하는 메시지는, 무한히 재시도되지 않고 일정 횟수 이상 실패하면 **Poison Queue** 라고 불리는 별도의 큐로 옮겨진다. 이 글에서는 Poison Queue 의 동작 원리와, 그 판정 기준이 되는 `DequeueCount` 에 대해 정리한다.

> Queue 트리거의 기본 동작과 VisibilityTimeout 에 대해서는 [Azure Functions - Queue Trigger - VisibilityTimeout](/posts/azure-functions-queuetrigger/) 글을 참고.

## Queue 트리거 처리 종료 시 동작
Queue 트리거의 처리 종료 시에는 [CompleteProcessingMessageAsync](https://github.com/Azure/azure-webjobs-sdk/blob/3f4ec78be9f43bb041937425ced00b341883aa42/src/Microsoft.Azure.WebJobs.Extensions.Storage/Queues/QueueProcessor.cs#L99-L134) 가 실행되며, 그 안에서 Poison Queue 로의 이동 여부가 결정된다.

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

위 코드를 보면, 실패 시의 분기에서 `DequeueCount >= MaxDequeueCount` 조건을 만족하는 경우에 `HandlePoisonMessageAsync` 가 호출된다. 즉, 정해진 횟수 이상 재시도되었음에도 처리에 실패한 메시지를 별도의 큐(Poison Queue)로 옮겨서, 같은 메시지가 무한히 재시도되는 것을 막는 구조이다.

## DequeueCount 란?
- `DequeueCount` 는 **해당 메시지가 큐에서 몇 번 꺼내졌는지(dequeue 되었는지) 를 나타내는 카운터**이다. Azure Storage Queue 자체가 메시지마다 가지고 있는 메타데이터이며, Azure Functions 만의 개념이 아니다.
- 메시지가 큐에 처음 들어왔을 때는 `DequeueCount = 0` 인 상태이다. 클라이언트(여기서는 Queue 트리거)가 `GetMessagesAsync` 로 메시지를 가져오는 순간, 큐 측에서 자동으로 `DequeueCount` 가 1 증가한다.
- 즉, 메시지가 정상적으로 1회 처리되어 삭제되면 그 메시지의 `DequeueCount` 는 결국 1 로 종료된다. 반면, 처리에 실패해서 다시 가시 상태로 돌아간(`ReleaseMessageAsync` 가 호출된) 메시지를 다음 번에 다시 꺼내면 `DequeueCount` 가 2 가 된다. 이런 식으로 실패할 때마다 카운트가 누적된다.
- Queue 트리거 함수에서는 `QueueMessage` 객체의 `DequeueCount` 프로퍼티로 확인할 수 있으며, Application Insights 의 traces 로그에서도 `Trigger Details: MessageId: ..., DequeueCount: N` 형식으로 출력된다.
- 따라서, **`DequeueCount` = 그 메시지의 누적 시도 횟수**라고 이해할 수 있다. 이 값이 `MaxDequeueCount` 이상이 되면 Poison Queue 로 이동된다.

## MaxDequeueCount 와 Poison Queue 의 동작
- `MaxDequeueCount` 의 기본값은 **5회**이며, host.json 의 `maxDequeueCount` 설정으로 변경할 수 있다. 즉, 동일 메시지가 5번 처리에 실패하면 6번째에는 Poison Queue 로 이동한다.
- Poison Queue 의 이름은 **`<원본큐이름>-poison`** 형식으로 자동 결정된다. 예를 들어, 원본 큐 이름이 `myqueue` 라면, Poison Queue 의 이름은 `myqueue-poison` 이 된다.
- Poison Queue 는 Azure Functions 런타임이 첫 Poison 메시지가 발생하는 시점에 자동으로 생성한다. 따라서 사전에 별도로 만들어 둘 필요는 없다.
- 동작 흐름
  1. 메시지가 처리에 실패하면 `ReleaseMessageAsync` 가 호출되어 메시지가 다시 가시 상태가 되고, `DequeueCount` 가 1 증가한 상태로 다시 큐에 돌아간다.
  2. 위 과정이 반복되어 `DequeueCount` 가 `MaxDequeueCount` 에 도달하면, 다음 처리 종료 시 `HandlePoisonMessageAsync` 가 호출되어 메시지가 원본 큐에서 삭제되고, Poison Queue 에 원본 메시지가 그대로 추가된다.

## Poison Queue 처리 패턴
Poison Queue 로 옮겨진 메시지는 그대로 두면 처리되지 않은 채 쌓이기만 하므로, **Poison Queue 를 입력으로 하는 별도의 Queue 트리거 함수를 만들어** 후속 처리(로그 기록, 알림, 수동 재처리 등)를 구현하는 것이 일반적인 패턴이다.

```csharp
// Poison Queue 를 처리하는 함수 예시
[Function("PoisonQueueHandler")]
public void Run([QueueTrigger("myqueue-poison")] string message, FunctionContext context)
{
    // 실패한 메시지에 대한 로그 기록, 알림 발송 등
}
```

> 참고: host.json 에 `poisonQueue` 가 설정되지 않은 경우(혹은 Poison Queue 처리가 구성되지 않은 경우)에는, 위 코드의 `else` 분기에 의해 `ReleaseMessage` 가 호출되지 않고 메시지가 비가시 상태로 남는다. 이는 빠른 무한 루프를 방지하기 위한 동작이다.


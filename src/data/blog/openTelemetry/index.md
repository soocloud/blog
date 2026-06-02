---
title: Azure Functions - Open Telemetry
description: Azure Funtions 에서 Open Telemetry 를 활용해 로그 보내기
pubDatetime: 2026-05-25T09:00:00+09:00 
category: cloud  
draft: false
tags:
  - Azure Functions
---

## Intro
Azure Functions 는 Language Woker process 와 host process 각각에서 함수 실행에 대한 Telemetry 데이터 (로그 등)을 생성한다. 둘 다 기본적(by default)으로 Application Insights SDK (AI SDK) 를 사용해서 `Worker -> Host -> Application Insights` 파이프라인을 타고 데이터를 보낸다. 

하지만, 이 방식은 telemetry 데이터를 인메모리 버퍼에 모았다가 일정 주기 (보통 30초) 로 Flush 하기 때문에, Azure Functions 의 인스턴스가 재기동/교체되는 경우 로그가 누락될 수가 있다.
한편, AI SDK 가 아닌, OpenTelemetry(OTEL) 를 사용하면, Worker 에서 Host를 경유하지 않고 OTEL endpoint 로 송신하기 떄문에 이를 어느정도 방지할 수 있다.

## 장점
1. **벤더 중립적 표준 형식**: Application Insights 뿐 아니라 Jaeger, Grafana Tempo, Datadog 등 OTEL 호환 백엔드로 자유롭게 송신 가능
2. **Host 와 Worker telemetry 간 상관관계 개선**: 양쪽을 모두 OTEL 로 설정하면 trace 와 log 의 correlation 이 일관되게 처리됨
3. **Worker 가 Host 를 경유하지 않고 직접 송신 가능**: Worker 측에서 OTEL 을 활성화하면 Host 파이프라인을 거치지 않고 OTEL Exporter 로 바로 전송 (단, 중복 방지를 위해 `PYTHON_APPLICATIONINSIGHTS_ENABLE_TELEMETRY=true` 환경변수 설정 필요)

## 방법
1. Host process 에 대해 설정 
(Host 레벨에서만 OTEL, Language Woker 는 Host 로 포워드되기 때문에 OTEL 을 타게된다.)
host.json에 아래 추가
```json
{
  "version": "2.0",
  "telemetryMode": "OpenTelemetry",
  ...
}
```

2. Language Worker process 에 대해 설정
(Language Woker 에만 OTEL, Host 레벨에서는 여전히 AI SDK.)

    1. requests.txt
    ```python
    azure-monitor-opentelemetry
    ```
    2. function_app.py
    ```python
    from azure.monitor.opentelemetry import configure_azure_monitor 

    configure_azure_monitor() 
    ```

> 참고: [Use OpenTelemetry with Azure Functions (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/azure-functions/opentelemetry-howto?tabs=app-insights%2Cihostapplicationbuilder%2Cmaven&pivots=programming-language-python#enable-opentelemetry-in-the-functions-host)

## Question
위의 "방법" 에서 보면 Host / Worker 각각의 설정방식이 있다. 이 때, 별도로 설정하게 되면 어떤 일이 발생할까?
직접 움직임을 검증해보자.

## 검증
- 환경 구성
Python 런타임 스택
1분 간격으로 돌아가는 timer trigger를 사용. 실행 시, info 레벨의 로그 "Python timer trigger function ran at 시간" 출력
```python
import datetime
import logging

app = func.FunctionApp()

@app.function_name(name="testtimer")
@app.timer_trigger(
    schedule="0 */1 * * * *",
    arg_name="mytimer",
    run_on_startup=False,
    use_monitor=True,
)
def testtimer(mytimer: func.TimerRequest) -> None:
    utc_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if mytimer.past_due:
        logging.info("The timer is past due!")

    logging.info("Python timer trigger function ran at %s", utc_timestamp)
```

조회시 사용한 kql
```kql
traces
| project-reorder timestamp, cloud_RoleName, operation_Name, message
| order by timestamp desc
```

- 결과 
1. 시나리오 1 - 아무 설정을 하지 않은 경우
   - Worker 상의 모든 로그는 Host 로 forward 되고 host 의 파이프라인을 탄다.
   - 이때 host는 AI SDK 를 기본적으로 사용하고 있기 때문에 둘다 OTEL 이 아니게 된다.
   - sdkVersion : azurefunctions 가 되어있다.

   host 수준 로그 예시
   ![alt text](image-1.png)
   worker 수준 로그 예시
   ![alt text](image-2.png)


2. 시나리오 2 - host.json 만 설정.
   - worker 상의 모든 로그는 host 로 forward되고 host 의 파이프라인을 탐.
   - 이때 host는 OTEL Exporter를 사용하고 있기 때문에 둘다 OTEL 이 됨.
   - sdkVersion 에 otel 이 추가되어있다.

   host 수준 로그 예시
   ![alt text](image-3.png)
   worker 수준 로그 예시
   ![alt text](image-4.png)

3. 시나리오 3 - worker 상에서만 설정. (host.json 에는 OTEL 설정 없음)
   - worker 는 자체적으로 파이프라인을 형성해 host 우회한다.
   - 이 때, worker, host 둘 다 개별 파이프라인을 형성하기 때문에 로그가 중복이 생기며, `PYTHON_APPLICATIONINSIGHTS_ENABLE_TELEMETRY=true` 환경변수 설정이 필요해진다.

   함수 실행 시, 어플리케이션 상의 로그가 worker, host 에서 동시에 생성됨 
   ![alt text](image-5.png)
   host는 여전히 sdkVersion이 azurefunction 이다. 
   ![alt text](image-6.png)
   worker 상의 로그는 otel 이다.
   ![alt text](image-7.png)

   host 수준 로그 예시
   ![alt text](image-8.png)


4. 시나리오 4 - 둘 다 설정
   - 둘 다 otel 이 확인된다.

   호스트 수준의 로그
   ![alt text](image-9.png)
   이제 워커 수준의 로그
   ![alt text](image-10.png)
   또 다른 호스트 수준의 로그를 보자
   ![alt text](image-11.png)


5. 마지막으로 `PYTHON_APPLICATIONINSIGHTS_ENABLE_TELEMETRY=true` 환경변수 설정을 검증해보면 아래와 같다.

   - 시나리오 3 에서 함수 실행 상의 로그 `Python timer trigger function ran at YYYY-MM-DD` .. 가 호스트 수준에서, 워커수준에서 전송되기 때문에 2회씩 나타난다.
   - 그이유는 워커수준에서의 로그는 일단 exporter로 otel 파이프라인을 타면서도, 또 호스트 파이프라인도 동시에 타기 때문이다.

   ![alt text](image-12.png)

   - 설정 후 변화를 확인해보면, 그동안 동시에 2개씩 생성된 것이 이제 1개씩만 생성된다.
   ![alt text](image-13.png)
   - sdkVersion 이 `fli_py3.xx` 인 것으로 보아, Worker 레벨에서 생성되는 것만 남고, host 레벨에서는 더 이상 생성되지 않은 것을 볼 수 있다.
   ![alt text](image-14.png)
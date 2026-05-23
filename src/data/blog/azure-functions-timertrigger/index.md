---
title: Azure Functions - Timer Trigger 관련 트러블슈팅
description: Azure Funtions 의 Timer Trigger 의 동작, 트러블슈팅 방법
pubDatetime: 2026-05-23T18:00:00+09:00   # JST 기준 ISO8601
category: cloud                            # cloud | dev | ai | life (1개)
draft: true                                # 작성 중 — 완료되면 false로 변경
tags:
  - Azure Functions
---
## Intro
아무래도 PaaS 환경에서 인스턴스가 재기동되거나, 교체되는 경우가 있다보니, Timer Trigger 의 미실행, 처리실패 등과 관련하여 트러블슈팅하는 경우가 빈번하다. 이번 글에는 Timer Trigger 의 동작방식, 트러블슈팅 사례, 그 방법 등을 다뤄보고자 한다.

## Timer Trigger 란?
Azure Functions 에는 다양한 트리거가 있는데, 이번에는 Timer Trigger에 다뤄보고자 한다.
Timer Trigger는 배치 처리 등 Cron 식으로 지정한 스케줄에 따라 실행되는 함수이다.

1. Singleton Lock

특정 시점에 1개 인스턴스에만 처리가 움직이는 것을 의미한다. Timer Trigger는 Blob 컨테이너에 Trigger 마다 배치된 파일Lock 을 취득한 인스턴스에만 동작한다. 즉, 인스턴스가 여러가 존재해도 그 중 하나의 인스턴스만 Lock 을 취득해서 Timer Trigger가 실행되도록 제어한다. 해당 파일은 보통 `AzureWebJobsStorage` 에 지정한 Storage Account 의 Blob 컨테이너에 `azure-webjobs-hosts/locks/azure-webjobs-hosts/locks/Host.Functions.<트리거명>.Listener` 으로 존재한다.
![alt text](./image.png)


2. 

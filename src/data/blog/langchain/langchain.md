---
author: Dongsoo
pubDatetime: 2026-05-23T01:00:00+09:00
title: LangChain/LangGraph Tutorial
featured: false
draft: false
category: ai
tags:
  - Langchain
  - LangGraph
description: LangChain/LangGraph 로 RAG 앱 개발
---

## RAG
Retrieval Augmented Generation
1. Retrieval : 언어모델이 가지고 있지 않은 데이터를 컴퓨터 시스템 (Vector Store) 으로부터 가져오는 것 
2. Augmented : Retrieval된 데이터를 LLM 이 아는 것처럼 생성함.
=> 여기까지가 개발자의 역할이다. Generation 부터는 LLM 모델의 영역.

## Vector
1. Embedding 모델을 이용해서 Vector를 생성한다.
2. 이때 한국어는 Upstage 의 Embedding 모델 OpenAI의 Embedding 모델보다 낫다.

## Vector Database
Vector Store
1. 답변을 생성할 때 필요한 데이터. 즉, 사용자의 질문과 관련있는 데이터.
   - 관련성 = Vector. 단어나 문장의 유사도로 관련성을 파악.
3. Embedding 모델을 활용해서 Vector를 생성
   - Embedding 모델: 비슷한 단어가 자주 붙어서 나오는 경우, 유사할 가능성이 높다고 파악. 
   - https://projector.tensorflow.org/
3. Embedding 모델을 통해 생성된 Vector 데이터와, 출처의 문서 이름 등의 정보를 저장된 Database

## Vector 유사도
cosine_similarity(wordA_vector, wordB_vector)

## 환경설정
1. Python venv
2. OpenAI API Key 획득 https://platform.openai.com/home
3. 워크스페이스에 .env 파일만들어서아래와 같이 붙여넣자.
`OPENAI_API_KEY=sk-proj-oZ5pgze024aTDQLBfF3a4...`
4. 테스트를 위한 test.ipynb 파일을 만들고, `%pip install langchain-openai python-dotenv` 를 입력, 실행<br>
(이때, Jupyter 노트북을 돌리기위해 ipykernel 패키지가 필요하다는 말이 나온다. 추후 streamlit 에 배포할 때는 필요없지만 일단 연습용으로 써야하니 인스톨)
5. 그리고 다음과 같은 코드로 테스트해볼 수 있음
```python
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
llm = ChatOpenAI() # 이 때 환경변수 OPENAI_API_KEY 가 있는지 확인. 없으면 import os 해서 직접 가져와서 인수로 넣어줘야함.

ai_message = llm.invoke("한국의 수도는?") # 여기서 Token 체크 들어감
print(ai_message.content) # 답변 출력
```

(Upstage를 사용하는 경우)
```python
%pip install python-dotenv langchain-upstage
from dotenv import load_dotenv
load_dotenv()
from langchain_upstage import ChatUpstage
llm = ChatUpstage()
ai_message = llm.invoke("한국의 수도는?")
```

## 소득세법으로 RAG 하기



 


## 주의사항
1. 문서를 chunking 하는 것도 어렵다.
데이터를 가져오는 게 어렵고, 잘 가져오더라도, 전달하는 게 또 어렵다.





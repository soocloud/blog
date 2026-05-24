---
author: Dongsoo
pubDatetime: 2026-05-24T11:00:00+09:00
title: LangChain/LangGraph RAG Tutorial
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
1. 소득세법 word 파일 다운로드하고, 파일형식을 docx 로 바꾸기 (rtf가 아님)
2. 문서내용을 읽는다. (by [Langchain DocumentLoader](https://docs.langchain.com/oss/python/integrations/document_loaders/unstructured_file))

```python
%pip install --upgrade --quiet "unstructured[docx]" langchain-community
from langchain_community.document_loaders import UnstructuredWordDocumentLoader

loader = UnstructuredWordDocumentLoader("./text.docx")
document = loader.load()
#print(document[0].page_content) -> 길이가 1인 리스트로 반환됨. document[0]은 Document 객체임. document[0].page_content는 text.docx 파일의 내용을 문자열로 반환함.
```
   - `langchain_community` 는 내부적으로 `unstructrued`를 호출한다. 따라서 unstructured 가 설치되어있지 않으면 런타임 에러.
   - `unstructured` : 실제 docx 파일을 열어서 텍스트/표/제목을 뽑아냄
   - `langchain_community` : 위의 unstructured 엔진을 LangChain 표준 규격(다른 파일형식과 동일하게) 에 맞게 감싸줘서 Langchain RAG 파이프라인에 들어갈 수 있게 함. [^1]

3. 문서를 쪼갠다. (by [Recursive Text Spliiter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter))
    - Resursive 는 텍스트를 더 다양한 인자를 기준으로 쪼갤 수 있다.
    - chunk_size : 1개의 chunk 가 가질 토큰의 사이즈 (텍스트 크기)
    - chunk_overlap : 위 chunk 가 조금씩 겹치게해서, 각 chunk 간의 유사성을 파악할 수 있게함(정확도 향상) 
```python 
%pip install -qU langchain-text-splitters
from langchain_community.document_loaders import UnstructuredWordDocumentLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200) 

loader = UnstructuredWordDocumentLoader("./text.docx")
document_list = loader.load_and_split(text_splitter=text_splitter) 
```

4. 임베딩




 


## 주의사항
1. 문서를 chunking 하는 것도 어렵다.
데이터를 가져오는 게 어렵고, 잘 가져오더라도, 전달하는 게 또 어렵다.

------------------------------


[^1]: 해당 내용을 그래프로 나타내면 아래와 같다.

    ```mermaid
    flowchart TB
        A["tax.docx<br/>(원본 문서)"] --> B
        subgraph ENGINE["<span style='color:#000000'>unstructured 패키지</span>"]
            B["partition_docx()<br/>실제 파싱 엔진"]
            B --> C["raw elements<br/>(Title, NarrativeText, Table...)"]
        end

        C --> D

        subgraph ADAPTER["<span style='color:#000000'>langchain-community 패키지</span>"]
            D["UnstructuredWordDocumentLoader<br/>(어댑터/래퍼)"]
            D --> E["List[Document]<br/>page_content + metadata"]
        end

        E --> F

        subgraph RAG["<span style='color:#000000'>  LangChain RAG 파이프라인</span>"]
            direction TB
            F["TextSplitter<br/>(청크 분할)"] --> G["Embedding<br/>(벡터화)"]
            G --> H["VectorStore<br/>(저장)"]
            H --> I["Retriever<br/>(유사도 검색)"]
            I --> J["LLM<br/>(답변 생성)"]
        end

        style ENGINE fill:#fff4e6,stroke:#ff9800
        style ADAPTER fill:#e3f2fd,stroke:#2196f3
        style RAG fill:#f3e5f5,stroke:#9c27b0
    ```



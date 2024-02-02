from typing import List
from ojd_daps_skills.pipeline.extract_skills.extract_skills import ExtractSkills
es = ExtractSkills(config_name="extract_skills_lightcast")
es.load()


from fastapi import FastAPI
from pydantic import BaseModel

class Excerpt(BaseModel):
    text: str

class ExcerptList(BaseModel):
    texts: List[str]

app = FastAPI()

@app.post("/extract/one")
async def extract_one(data: Excerpt):
    text = data.text.split("\n")
    extract = es.extract_skills(text, False)
    # convert to json and respond
    return { "record": extract }

@app.post("/extract/one")
async def extract_multiple(data: ExcerptList):
    texts = [text.split("\n") for text in data.texts]
    extract = es.extract_skills(texts, False)
    return { "record": extract }
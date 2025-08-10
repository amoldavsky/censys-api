## Nodejs over Python backend

Implementation is light enough, only a few endpoints and the agentic flow is simple.
LangChainJs allows us to use almost all features of the Pythonic LangChain.
- Super far prototyping
- native js/ts ecosystem
- Bun + Hono allows for blazing fast startup and overall performance
- we do not need to use NumPy
- we do not need to utilize python specific features for LangChain or LangGraph
- can be side-chained to the front-end if needed for even faster prototyping

## MongoDB over PostgreSQL

Started with PostgreSQL but was not sure about schema uniformity.
Decided to use MongoDB for now and allow JSON schema flexibility dictated by uploaded assets.
These assets may come from various scan tools that may change and we don't want to be locked into a schema in this case.

## File uploads from browser

Initially the API was taking in multi-part upload. But at a second thought, there is no good use-case
for storing the uploaded files and once parsed not really needed for anything. With that paradigm shift, it is 
simpler to upload them to a temp bucket with TTL outside of the api. If this was a production grade
service these would be S3 pre-signed URLs but for this POC Byesclase gives us an easy and quick solution.

# Not keeping asset history (asset updated over time)

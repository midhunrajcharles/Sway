# Latest benchmark rows for the AG Grid views (/api/sway/unknown/getResults)

`GET /api/results`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/results:
    get:
      summary: Latest benchmark rows for the AG Grid views
      operationId: getResults
      parameters:
        - name: run
          in: query
          required: false
          schema:
            type: string
          description: Specific results directory (defaults to the latest in results/).
      responses:
        "200":
          description: results rows + xray
          content:
            application/json:
              schema:
                type: object
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.GetResults(
                      new GetResultsRequest());
                  // TODO: Handle 'response' of type object
              }
              catch (ApiException<RawError> ex)
              {
                  // TODO: Handle 'ex.Error' of type RawError
              }
        - lang: python
          label: Python
          sources:
            Example: |-
              try:
                  response = client.get_results()
                  # TODO: Handle 'response' of type Any
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.getResults();
                // TODO: Handle 'response' of type Record<string, unknown>
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
info:
  title: Sway API
  version: 0.2.0
```
# Benchmark tasks with real Channel3 products (/api/sway/unknown/getTasks)

`GET /api/tasks`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/tasks:
    get:
      summary: Benchmark tasks with real Channel3 products
      operationId: getTasks
      responses:
        "200":
          description: tasks + conditions
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TasksEnvelope"
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.GetTasks();
                  // TODO: Handle 'response' of type TasksEnvelope
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
                  response = client.get_tasks()
                  # TODO: Handle 'response' of type TasksEnvelope
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.getTasks();
                // TODO: Handle 'response' of type TasksEnvelope
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
components:
  schemas:
    TasksEnvelope:
      type: object
      properties:
        conditions:
          type: array
          items:
            type: string
        tasks:
          type: array
          items:
            type: object
info:
  title: Sway API
  version: 0.2.0
```
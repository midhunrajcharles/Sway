# What the shopping agent would buy (baseline, no Sway check) (/api/sway/unknown/postPick)

`POST /api/pick`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/pick:
    post:
      summary: What the shopping agent would buy (baseline, no Sway check)
      operationId: postPick
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/TaskConditionBody"
      responses:
        "200":
          description: agent pick + stability
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pick"
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.PostPick(new PostPickRequest
                  {
                      Body = new TaskConditionBody
                      {
                          Task = "some example string",
                          Condition = Condition.Clean,
                      },
                  });
                  // TODO: Handle 'response' of type Pick
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
                  response = client.post_pick(
                      TaskConditionBody(
                          task="some example string",
                          condition=Condition.CLEAN,
                      ),
                  )
                  # TODO: Handle 'response' of type Pick
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.postPick({
                  body: {
                    task: "some example string",
                    condition: Condition.Clean,
                  },
                });
                // TODO: Handle 'response' of type Pick
              } catch (err) {
                // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
              }
components:
  schemas:
    TaskConditionBody:
      type: object
      properties:
        task:
          type: string
          example: running-shoes
        condition:
          type: string
          enum:
            - clean
            - honest_strong
            - attack_hidden
            - attack_redundant
            - deceptive_visible
            - covert_instruction
            - price_smear
            - fake_reviews
      required:
        - task
        - condition
    Pick:
      type: object
      properties:
        task:
          type: object
        products:
          type: array
          items:
            $ref: "#/components/schemas/Product"
        condition:
          type: string
        chosen:
          type: string
        stability:
          type: number
          format: float
        pages:
          type: array
          items:
            $ref: "#/components/schemas/Page"
        target:
          type: string
          nullable: true
    Product:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        price:
          type: number
        seller:
          type: string
    Page:
      type: object
      properties:
        id:
          type: string
        url:
          type: string
          format: uri
info:
  title: Sway API
  version: 0.2.0
```
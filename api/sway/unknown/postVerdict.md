# Full Sway verdict before PayPal captures (/api/sway/unknown/postVerdict)

`POST /api/verdict`

```yaml
openapi: 3.2.0
servers:
  - url: http://127.0.0.1:8787
    description: Local Sway API
  - url: https://sway-api-utg2.onrender.com
    description: Render blueprint (sway-api service, live)
paths:
  /api/verdict:
    post:
      summary: Full Sway verdict before PayPal captures
      operationId: postVerdict
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/TaskConditionBody"
      responses:
        "200":
          description: verdict + x-ray + one-sentence explanation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Verdict"
      x-apimatic-codeSamples:
        - lang: csharp
          label: C#
          sources:
            Example: |-
              try
              {
                  var response = await client.PostVerdict(
                      new PostVerdictRequest
                      {
                          Body = new TaskConditionBody
                          {
                              Task = "some example string",
                              Condition = Condition.Clean,
                          },
                      });
                  // TODO: Handle 'response' of type Verdict
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
                  response = client.post_verdict(
                      TaskConditionBody(
                          task="some example string",
                          condition=Condition.CLEAN,
                      ),
                  )
                  # TODO: Handle 'response' of type Verdict
              except ApiError as e:
                  ...  # TODO: Handle 'e.error' of type RawError
        - lang: typescript
          label: TypeScript
          sources:
            Example: >-
              try {
                const response = await client.postVerdict({
                  body: {
                    task: "some example string",
                    condition: Condition.Clean,
                  },
                });
                // TODO: Handle 'response' of type Verdict
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
    Verdict:
      type: object
      properties:
        verdict:
          type: string
          enum:
            - allow
            - block
        sentence:
          type: string
        chosen:
          type: string
        stability:
          type: number
          format: float
        xray:
          type: array
          items:
            type: object
        decider:
          type: string
          nullable: true
        payout_eligible:
          type: boolean
info:
  title: Sway API
  version: 0.2.0
```
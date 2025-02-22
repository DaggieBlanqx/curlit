# curlit

- **curlit** is an Express middleware that logs a multi‑line cURL command representing the incoming request and its response.
- This can be useful for debugging, testing, or reproducing API calls easily.
- You can copy the curl, and run it.
- Or paste into [postman](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-curl-commands/) to build a postman collection.


## Installation

```bash
npm install curlit
```

## Usage
```js
const express = require('express'); // or import express from 'express'
const curlit = require('curlit'); // or import curlit from 'curlit'

const app = express();

// Use JSON parsing middleware if needed
app.use(express.json());

// Use curlit middleware to log cURL commands
app.use(curlit);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## How the log looks like

### Request example
- Here is an example of a GET request that has been intercepted/middlewared and logged out:
  ```curl
  curl --location 'http://localhost:9000/api/transactions?page=1&pageSize=10' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE3NDAyNTY4ODYsImV4cCI6MTc3MTc5Mjg4NiwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.TcvmooXDwMgTo2vtPWkFbhp-eOywKpfCUl7kQvMU81g' \
  --header 'x-client-id: com.example.app' \
  --header 'host: localhost:9000' \
  --header 'accept-encoding: gzip, deflate, br' \
  --header 'connection: keep-alive'
  ```

### Response example:
- Here is an example of a response that has been intercepted/middlewared and logged out:
  ```json

  {
      "success": true,
      "records": [
          {
              "id": 123456789,
              "status": "Completed",
              "reference": "INV-98765",
              "amount": 100.5,
              "currency": "USD",
              "channel": "Credit Card",
              "paidAt": "2024-02-20T15:30:00Z",
              "customerId": "67b49ecb34975e212b9afbc0",
              "yearMonth": 202402
          },
          {
              "id": 123456790,
              "status": "Pending",
              "reference": "INV-98766",
              "amount": 50,
              "currency": "USD",
              "channel": "Mpesa",
              "paidAt": "2024-02-21T10:00:00Z",
              "customerId": "67b49ecb34975e212b9afbc0",
              "yearMonth": 202402
          }
      ],
      "total": 150.5,
      "page": 1,
      "pageSize": 2,
      "remaining": 5
  }

  ```

## How It Works
- **Request Interception**: The middleware captures the incoming request.
- **Building the cURL Command**: It constructs a cURL command that includes the HTTP method, headers, data (for non-GET requests), and full URL.
- **Logging**: The constructed command and response body are logged to the console.
- Continuation: The original res.send is then called to complete the response.

## License
- MIT


### Help information

-   If you have any questions, ask via the [GitHub Discussion forums](https://github.com/DaggieBlanqx/curlit/discussions)
-   If you have any suggestions or feedback, please [open an issue](https://github.com/DaggieBlanqx/curlit/issues) or [create a pull request](https://github.com/DaggieBlanqx/curlit/pulls).

### Notes:

-   This package is in active development.
-   This means new features are added regularly.
-   Incase your favorite feature is missing, you can always bump a version backwards or [create a pull request](https://github.com/DaggieBlanqx/curlit/pulls) which will be reviewed and merged into [the next release](https://github.com/DaggieBlanqx/curlit/releases).
-   Thanks for your contribution.
-   Happy coding!

### Reach out:

-   Follow me on Twitter: [@daggieblanqx](https://twitter.com/daggieblanqx)
-   I am also on LinkedIn, where you can tag me to the awesome projects you've built using this package: [@daggieblanqx](https://www.linkedin.com/in/daggieblanqx/)
-   Blog posts: [Logrocket/@Daggieblanqx](https://blog.logrocket.com/author/daggieblanqx/)

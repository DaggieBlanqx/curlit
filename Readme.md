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

## How It Works
- **Request Interception**: The middleware captures the incoming request.
- **Building the cURL Command**: It constructs a cURL command that includes the HTTP method, headers, data (for non-GET requests), and full URL.
- **Logging**: The constructed command and response body are logged to the console.
Continuation: The original res.send is then called to complete the response.


## License
- MIT
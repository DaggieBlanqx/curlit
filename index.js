/**
 * curlit - Express middleware to log a cURL command representation of requests and responses.
 */
function curlit (req, res, next) {
  // Keep a reference to the original res.send method
  const originalSend = res.send

  // Override res.send to capture response data
  res.send = function (body) {
    // Start the curl command with the method and a trailing backslash for continuation
    let curlCommand = `curl -X ${req.method} \\\n`

    // Add headers to the curl command
    Object.entries(req.headers).forEach(([header, value]) => {
      curlCommand += `  -H "${header}: ${value}" \\\n`
    })

    // If the request method is not GET and there's a body, add it as data
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
      const data =
              typeof req.body === 'object' ? JSON.stringify(req.body) : req.body
      curlCommand += `  -d '${data}' \\\n`
    }

    // Append the full URL (without a trailing backslash)
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    curlCommand += `  "${fullUrl}"`

    // Log the curl command and the response body to the console
    console.log('\nCurl command for the request:===========\n')
    console.log(curlCommand)
    console.log('\nResponse body: =============\n')
    console.log(body)

    // Call the original res.send to finish the response
    return originalSend.call(this, body)
  }

  // Proceed to the next middleware or route handler
  next()
};

export default curlit

const http = require('http');

async function testApi() {
  // Test login
  console.log("Testing login endpoint...");
  
  const postData = JSON.stringify({
    email: "admin@test.com",
    password: "Test123456"
  });
  
  const options = {
    hostname: 'backend',
    port: 8000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
      
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        const token = response.access_token;
        console.log(`Token: ${token.substring(0, 50)}...`);
        
        // Test modules endpoint
        console.log("\nTesting modules endpoint...");
        
        const modulesOptions = {
          hostname: 'backend',
          port: 8000,
          path: '/api/v1/modules',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const modulesReq = http.request(modulesOptions, (modulesRes) => {
          let modulesData = '';
          
          modulesRes.on('data', (chunk) => {
            modulesData += chunk;
          });
          
          modulesRes.on('end', () => {
            console.log(`Status: ${modulesRes.statusCode}`);
            const modulesResponse = JSON.parse(modulesData);
            console.log(`Total modules: ${modulesResponse.total}`);
          });
        });
        
        modulesReq.on('error', (e) => {
          console.error(`Modules request error: ${e.message}`);
        });
        
        modulesReq.end();
      } else {
        console.error(`Login failed: ${data}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });
  
  req.write(postData);
  req.end();
}

testApi();

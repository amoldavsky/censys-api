#!/usr/bin/env node

import fs from 'fs';

// Test with a minimal host dataset
const testData = {
  "metadata": {
    "description": "Test host data",
    "hosts_count": 1
  },
  "hosts": [
    {
      "ip": "168.196.241.227",
      "location": {
        "city": "New York City",
        "country": "United States",
        "country_code": "US"
      },
      "autonomous_system": {
        "asn": 263744,
        "name": "Udasha S.A."
      }
    }
  ]
};

// Write test file
fs.writeFileSync('test-hosts.json', JSON.stringify(testData, null, 2));

console.log('Created test-hosts.json with minimal data');
console.log('Test with: curl -X POST -H "Content-Type: multipart/form-data" -F "file=@test-hosts.json;type=application/json" http://localhost:3000/api/v1/assets/hosts/upload');

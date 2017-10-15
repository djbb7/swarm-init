"use strict";
const http = require('http')
const request = require('request')

const url = 'http://localhost:3000/1/config'


//config
function getConfig() {
  request.get(url, (error, response, body) => {
    if(response.statusCode == 202) {
      //retry
      console.log('retry')
    } 

    let config = JSON.parse(body)
  
    if(config.role == 'leader') {
      // swarm init
      swarmInit()
    } else {
      //swarm join
      swarmJoin()
    }
  })
}

function swarmInspect() {
  const options = {
    method: 'GET',
    socketPath: '/var/run/docker.sock',
    path: '/swarm',
    headers: { 
      'Content-Type': 'application/json'
    }
  }

  const callback = res => {
    console.log('callback')
    if(res.statusCode == 200) {
      console.log(res)
    }
    //res.JoinTokens
    //ip:port
  }

  const clientRequest = http.request(options, callback);
  clientRequest.end();
  console.log('Ended request')
}

function swarmInit() {
  console.log('Initializing Swarm')
  const options = {
    method: 'POST',
    socketPath: '/var/run/docker.sock',
    path: '/swarm/init',
    headers: { 
      'Content-Type': 'application/json'
    }
  }

  const callback = res => {
    console.log('callback')
    if(res.statusCode == 200) {
      console.log(res)
    }
    res.setEncoding('utf8');
    res.on('data', data => console.log(data));
    res.on('error', data => console.error(data));
  }

  const clientRequest = http.request(options, callback);
  console.log('Writing request to socket')
  clientRequest.write(JSON.stringify({
      "ListenAddr": "0.0.0.0:2377",
      "ForceNewCluster": true
    }))
  console.log('Wrote request')
  clientRequest.end();
  console.log('Ended request')
}

function swarmJoin() {
  console.log('swarm join')
}

getConfig()



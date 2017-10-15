"use strict";
const express = require('express')
const bodyParser = require('body-parser')
const yaml = require('js-yaml')
const fs = require('fs')

var swarm = {
  status: 'pending',
  managers: [],
  workers: [],
  tokens: {}
}

let config = {}
try {
    config = yaml.safeLoad(fs.readFileSync(process.env.CONFIG_FILE || 'swarm.yml', 'utf8'));
    const indentedJson = JSON.stringify(config, null, 4);
    console.log(indentedJson);
} catch (e) {
    console.log(e);
}

const app = express()
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/:id/config', function (req, res) {
  let node = null
  for(let nodeConfig of config.nodes) {
    if(nodeConfig.id == req.params.id) {
      node = {}
      node.role = nodeConfig.role
      break
    } 
  }  	

  if(node == null) {
    res.status(403).send('Not authorized')
    return
  }

  if(swarm.status == 'pending') {
    if(node.role == 'worker') {
      res.status(202).send('Not yet initialized')
      return
    } else if(node.role == 'manager') {
      node.role = 'leader'
      node.cmd = 'docker swarm init'
    }
  } else if(swarm.status == 'ready') {
    node.managers = swarm.managers
    node.token = swarm.tokens[node.role]
    node.cmd = `docker swarm join --token ${node.token} ${node.managers[0].ip}`     
  }

  res.send(node)
})

app.post('/:id/swarm-info', function (req, res) {
  let node = null
  for(let nodeConfig of config.nodes) {
    if(nodeConfig.id == req.params.id) {
      node = {}
      node.role = nodeConfig.role
      break
    } 
  }   

  if(node == null) {
    res.status(403).send('Not authorized')
    return
  }

  node.ip = req.body.ip

  if(node.role == 'manager') {
    swarm.managers.push(node)
  } else {
    swarm.workers.push(node)
  }

  if(req.body.hasOwnProperty('tokens')) {
    swarm.status = 'ready'
    swarm.tokens = req.body.tokens
  }

  res.send('OK')
})

app.get('/swarm', function (req, res) {
  res.send(swarm)
})

app.listen(process.env.PORT || 3000, function () {
  console.log('App started')
})

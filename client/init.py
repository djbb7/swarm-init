import docker
import time
import sys
import socket
import os
import requests

node_id = os.environ['NODE_ID']
config_url = "%s/%s/config" % (os.environ['CONFIG_SERVER'],node_id)
info_url = "%s/%s/swarm-info" % (os.environ['CONFIG_SERVER'],node_id)

client = docker.DockerClient(base_url='unix://var/run/docker.sock')

print 'Fetching node info'
r = requests.get(config_url)

while r.status_code != 200:
    print 'Swarm is not ready yet'
    time.sleep(5)
    r = requests.get(config_url)

print 'Fetched node info'

config = r.json()

if config['role'] == 'leader':
    #swarm init
    s = client.swarm.init(force_new_cluster=True)

    print 'Swarm initialized'
    
    worker_token = client.swarm.attrs['JoinTokens']['Worker']
    manager_token = client.swarm.attrs['JoinTokens']['Manager']

    ip = "%s:%s" % (socket.gethostbyname(socket.getfqdn()),'2377')
    r = requests.post(info_url, json = {'ip':ip, 'tokens':{'worker':worker_token, 'manager':manager_token}})

    if r.status_code != 200:
        print 'Failed to post swarm info'
        sys.exit(1)

    print 'Posted swarm info'
else:
    #swarm join
    s = client.swarm.join(remote_addrs=list(map((lambda x: x['ip']), config['managers'])), join_token=config['token'])

    print 'Joined swarm'
    
    if config['role'] == 'manager':
        ip = "%s:%s" % (socket.gethostbyname(socket.getfqdn()),'2377')
    else:
        ip = socket.gethostbyname(socket.getfqdn())
        
    r = requests.post(info_url, json = {'ip':ip})

    if r.status_code != 200:
        print 'Failed to post node info'
        sys.exit(1)

    print 'Posted node info'



import os, sys
import serial
from datetime import datetime
import time
import io
from github import Github
from github import InputGitTreeElement
import hashlib
import requests
import base64
import json


data_path_ti = "data/temp.csv"
data_path_tx = "data/tempx.csv"

if not os.path.isfile(data_path_ti):
    f = open(data_path_ti, "w")
    f.write("time,temp\n")
    f.close()
if not os.path.isfile(data_path_tx):
    f = open(data_path_tx, "w")
    f.write("time,temp\n")
    f.close()


##
    
def push_to_github(filename, repo, branch, token):
    url="https://api.github.com/repos/"+repo+"/contents/"+filename

    base64content=base64.b64encode(open(filename,"rb").read())

    data = requests.get(url+'?ref='+branch, headers = {"Authorization": "token "+token}).json()
    sha = data['sha']

    if base64content.decode('utf-8')+"\n" != data['content']:
        message = json.dumps({"message":"update",
                            "branch": branch,
                            "content": base64content.decode("utf-8") ,
                            "sha": sha
                            })

        resp=requests.put(url, data = message, headers = {"Content-Type": "application/json", "Authorization": "token "+token})

        print(resp)
    else:
        print("nothing to update")

token = "b2de458c21d443dd5516c466971f78b03b7355d9"
repo = "benjaminjulian/localpost"
branch="master"

ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=5)
sio = io.TextIOWrapper(io.BufferedRWPair(ser, ser))
sio.flush()

while True:
    now = datetime.now()
    line = sio.readline().replace("\n", "")
    try:
        if len(line) == 0:
            pass #print("Nada...", '\r')
        elif line == '110':
            line = sio.readline().replace("\n", "")
            f = open(data_path_ti, "a")
            f.write(now.strftime("%Y-%m-%dT%H:%M:%SZ,"))
            f.write(line + '\n')
            f.close()
            print("TempI: " + line)
            push_to_github(data_path_ti, repo, branch, token)
        elif line == '120':
            line = sio.readline().replace("\n", "")
            f = open(data_path_tx, "a")
            f.write(now.strftime("%Y-%m-%dT%H:%M:%SZ,"))
            f.write(line + '\n')
            f.close()
            print("TempX: " + line)
            push_to_github(data_path_tx, repo, branch, token)
        else:
            print('Other error', now.strftime("at %Y-%m-%dT%H:%M:%SZ,"), line)
    except:
        print("Villa!")
    time.sleep(10)

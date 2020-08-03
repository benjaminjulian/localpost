from PIL import Image
from picamera import PiCamera
from datetime import datetime
from github import Github
from github import InputGitTreeElement
import hashlib
import time
import requests
import base64
import json
import os

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

def d_c(c, col1, col2, acc): #checks if c deviates more from col1 and col2 than col1 from col2
    d_cols = abs(col1 - col2) #10
    p_cols = max(col1, col2) / min(col1, col2) #1.069
    avg_cols = (col1 + col2) / 2
    
    d_1 = abs(c - col1) #15
    d_2 = abs(c - col2) #25
    
    d_c = abs(c - avg_cols) #20
    p_c = max(avg_cols, c) / max(1, min(avg_cols, c))
    
    if d_c > d_cols and p_c > p_cols and abs(p_c) - 1 > acc:
        if p_c > 1:
            return 1
        elif p_c < 1:
            return -1
    else:
        return False

def scanpixels(p):
    balances = [0, 0, 0, 0, 0, 0] #r, g, b, m, p, y
    for pixel in p:
        acc = 0.15
        for j in range(0, 3):
            p1 = pixel[j]
            p2 = pixel[(j+1)%3]
            p3 = pixel[(j+2)%3]
            
            check = d_c(p1, p2, p3, acc)
            
            if check:
                if check > 0:
                    balances[j] += 1
                elif check < 0:
                    balances[j+3] += 1
    l = len(p)
    for k, b in enumerate(balances):
        balances[k] = str(int(round(100*b/l, 0)))
    
    return balances

token = "b2de458c21d443dd5516c466971f78b03b7355d9"
repo = "benjaminjulian/localpost"
branch="master"

col_data_path = "data/col.csv"
bal_data_path = "data/bal.csv"

if not os.path.isfile(col_data_path):
    f = open(col_data_path, "w")
    f.write("time,r,g,b,shutter,gain\n")
    f.close()

if not os.path.isfile(bal_data_path):
    f = open(bal_data_path, "w")
    f.write("time,r,g,b,m,p,y\n")
    f.close()

camera = PiCamera()
camera.awb_mode = 'sunlight'
camera.exposure_mode = 'backlight'
camera.iso = 100

while True:
    now = datetime.now()
    filename = "imgdump/" + now.strftime("%Y%m%dT%H%M%S.jpg")
    camera.capture("processing.jpg")
    speed = str(int(camera.exposure_speed))
    gain = str(float(camera.analog_gain))
    i = Image.open("processing.jpg")
    w, h = i.size
    i_c = i.crop((w/4,h/4,3*w/4,3*h/4))
    p = list(i_c.getdata())
    reds = []
    greens = []
    blues = []
    for pixel in p:
        r,g,b = pixel
        reds.append(r)
        greens.append(g)
        blues.append(b)
    i_r = int(sum(reds) / len(reds))
    i_g = int(sum(greens) / len(greens))
    i_b = int(sum(blues) / len(blues))
    a_r = str(i_r)
    a_g = str(i_g)
    a_b = str(i_b)
    print('iso: ' + str(camera.iso) + ', spd: ' + str(camera.exposure_speed))
    if (i_r + i_g + i_b) < 100:
        if camera.iso < 800:
            camera.iso = camera.iso * 2
            continue
    elif (i_r + i_g + i_b) > 600:
        if int(camera.exposure_speed) == 0:
            pass
        else:
            camera.shutter_speed = int(camera.exposure_speed * 0.5)
            continue
    #try:
    speed = str(int(camera.exposure_speed))
    gain = str(float(camera.analog_gain))
    i_s = i.crop((0,0,9*w/10,h))
    i_s.save("latest.jpg")
    i.save(filename)
    f = open(col_data_path, "a")
    f.write(now.strftime("%Y-%m-%dT%H:%M:%SZ,"))
    f.write(a_r + ',' + a_g + ',' + a_b + ',' + speed + ',' + gain + '\n')
    f.close()
    f = open(bal_data_path, "a")
    f.write(now.strftime("%Y-%m-%dT%H:%M:%SZ,"))
    f.write(",".join(scanpixels(p)) + '\n')
    f.close()
    print('(' + a_r + ',' + a_g + ',' + a_b + ') @' + speed + '/' + gain)
    push_to_github(col_data_path, repo, branch, token)
    push_to_github("latest.jpg", repo, branch, token)
    camera.iso = 100
    camera.shutter_speed = 0
    #except Exception as e:
    print('Villa: ' + str(e))
    time.sleep(10*60)

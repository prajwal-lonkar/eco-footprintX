# Eco FootprintX Deployment on Kubernetes

### Deploying the eco-footprintX application on Kubernetes.

### Pre-requisites to implement this project:
-  Create 2 AWS EC2 instance (Ubuntu) with instance type t2.medium and root volume 29GB.

#
## Steps for Kubernetes deployment:

1) Become root user :
```bash
sudo su
```

#
2) Clone code from remote repository (GitHub) :
```bash
get the eco-footprintX code from repo
```

#
3) Verify nodes are in ready state or not :
```bash
kubectl get nodes
```

#
4) Create kubernetes namespace :
```bash
kubectl create namespace eco-footprintX
```

#
5) Update kubernetes config context : 
```bash
kubectl config set-context --current --namespace eco-footprintX
```

#
6) Enable DNS resolution on kubernetes cluster :

- Check coredns pod in kube-system namespace and you will find <i> Both coredns pods are running on master node </i>

```bash
kubectl get pods -n kube-system -o wide | grep -i core
```

- Above step will run coredns pod on worker node as well for DNS resolution

```bash
kubectl edit deploy coredns -n kube-system -o yaml
```
<i> Make replica count from 2 to 4 </i>

#
7) Navigate to frontend directory :
```bash
cd frontend
```

#
8) Edit .env file and change the public IP Address with your worker node public IP :
```bash
vi .env
```

#
9) Build frontend docker image : 
```bash
docker build -t ./frontend-eco-footprintX:v2.1.8 .
```

#
10) Navigate to backend directory :
```bash
cd ../backend/
```

#
11) Open .env file and edit below variables : 

    - MONGODB_URI: \<your-mongodb-servicename>
    - FRONTEND_URL: \<your-workernode-publicIP>

> Note: To get service names, check <u>mongodb.yaml</u>

#
12) Build backend docker image : 
```bash
docker build -t ./backend-eco-footprintX:v2.1.8 .
```

#
13) Check docker images:
```bash
docker images
```

#
14) Login to DockerHub and push image to DockerHub
```bash
docker login
```

```bash
docker push ./frontend-eco-footprintX:v2.1.8
docker push ./backend-eco-footprintX:v2.1.8
```

#
15) Once, Image is pushed to DockerHub, navigate to kubernetes directory
```bash
cd ../kubernetes
```

#
16) Apply manifests file the below order:

    - Create persistent volume :
    ```bash
    kubectl apply -f persistentVolume.yaml 
    ```

    - Create persistent volume Claim :
    ```bash
    kubectl apply -f persistentVolumeClaim.yaml 
    ```

    - Create MongoDB deployment and service :
    ```bash
    kubectl apply -f mongodb.yaml 
    ```

    - Create Redis deployment and service :
    > Note: Wait for 3-4 mins to get mongodb, redis pods and service should be up, otherwise backend-service will not connect.
    ```bash
    kubectl apply -f redis.yaml 
    ```

    - Create Backend deployment and service :
    ```bash
    kubectl apply -f backend.yaml 
    ```

    - Create Frontend deployment and service :
    ```bash
    kubectl apply -f frontend.yaml
    ```

#
17)  Check all deployments and services :
```bash 
kubectl get all
```

18) Check logs for all the pods :
> Note: This is mandatory to ensure all pods and services are connected or not, if not then recreate deployments
```bash
kubectl logs <pod-name>
```

20) Navigate to chrome and access your application at 31000 port :
```bash
http://<your-workernode-publicip>:31000/
```
#

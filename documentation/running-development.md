# Running the Development Environment

The development environment is the local minikube instance.  It's similar
enough to our staging and production environments that it gives us the ability
to test many aspects of them (and of our deployment manifests) locally.  While
it's not a perfect simulation, it's close enough to be worthwhile.

## Setup

Getting the environment set up takes several steps.  First you'll need to
create a `secrets` directory and write some secrets manifest files.  Currently,
we only need a single Secrets manifest, which holds our Digital Ocean Spaces
Access Id and Access Key.

Create the directory `/infrastructure/kubernetes/development/secrets`, then add
the following manifest to it as `spaces-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-spaces-credentials 
type: Opaque
data:
  access_id: <Secret value will go here> 
  access_key: <Secret value will go here> 
```

If you're using the main account you can get the spaces from @danielBingham.
You can view the id by going to API in the left hand dashboard, but the key
isn't shown.  You could also generate a new pair, name it with your github user
name.

To add the ID and Key to the manifest, you will need to base64 encode them.
Don't ask me why, it seems to be a quirk of Kubernetes secrets.

```bash
$ echo -n "<Secret value>" | base64
```

Take the result and copy and paste it into the manifest.  You'll need to do
this for both the Id and the Key.  The `-n` on `echo` is important, it ensures
there isn't a newline added to the end of the value.

## Generating a self-signed Cert

Follow the instructions from here: https://stackoverflow.com/questions/21397809/create-a-trusted-self-signed-ssl-cert-for-localhost-for-use-with-express-node

## Running the Environment

To run the environment, run `minikube start`.  If you're on an `Ubuntu 22.04`
machine, then you'll need to specify an earlier Kubernetes version.  There
seems to be a bug in `1.24.x` that breaks minikube.

```bash
$ minikube start --kubernetes-version=1.23.8
```

Once minikube has started up, you can build your images in the minikube
environment.  This allows minikube to use your local images with out needing to
pull them from a repository.

First build the database image:

```bash
$ minikube image build -t peer-sql:latest database
```

Next build the application image:

```bash
$ minikube image build -t peerreview:latest .
```

Once that's done, you can start loading up manifests.  First, load up the
secrets manifest you wrote earlier. 

```bash
$ kubectl apply -f infrastructure/kubernetes/development/secrets/spaces-secrets.yaml
```

Then the database deployment:

```bash
$ kubectl apply -f infrastructure/kubernetes/development/peer-review-database.yaml
```

Finally the application deployment:

```bash
$ kubectl apply -f infrastructure/kubernetes/development/peer-review.yaml
```

To get the IP address that minikube is running on you can run:

```bash
$ minikube ip
```

You can access peer review by pointing your browser to that IP on port 30,000.
The port is the one set in the service defined in
`infrastructure/kubernetes/development/peer-review.yaml`

You'll need to configure spaces to allow CORS to that ip and port.  Go to the
Digital Ocean console, go to spaces, select the `peer-review-development-files`
space, go to "Settings" and under Cors add a new setting.  Set the host to
`http://<IP>:30000`.




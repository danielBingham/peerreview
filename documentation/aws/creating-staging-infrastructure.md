# Creating the Staging Infrastructure

The Staging infrastructure is created on AWS and uses Kubernetes for container
orchestration. Creating it involves first running the terraform and then
applying the Kubernetes manifests.

## AWS Infrastructure

Before running the terraform you will need to create an AWS account and a
programatic IAM user with an access key and access secret.  You will need to
create a credential file and a configuration file on the machine you'll be
running the terraform from to contain the access key and secret.  The terraform
assumes the config is defined at `~/.aws/config` and the credentials will be
stored at `~/.aws/creds`.  You will also need to name the profile, and use the
name consistently across both profiles.

### Running Terraform

The infrastructure is currently composed of modules that can either be
assembled into whole environments that can be managed with a single state file,
or components that can each be managed with its own state file.  Right now,
we're taking the latter approach, however, the former approach could be taken
with a little more effort to wire the modules together and automate a handful
of remaining manual tasks.

The components that will need to be created in order are:
- Storage (`infrastructure/terraform/aws/environments/staging/components/storage`)
- Certificate (`infrastructure/terraform/aws/environments/staging/components/certificate`)
- Network (`infrastructure/terraform/aws/environments/staging/components/network`)
- Database (`infrastructure/terraform/aws/environments/staging/components/database`)
- Cluster (`infrastructure/terraform/aws/environments/staging/components/cluster`)

Additionally, there is a Bastion component
(`infrastructure/terraform/aws/environments/staging/components/bastion`) that
will need to be created and then destroyed anytime access to private instances
or the database is needed.

The components will need to be created in order, and the outputs from the
earlier components will need to be used as variables for the later components.
See the variable names for each component for the outputs it requires.

### Initializing the Database

To initialize the database, you'll need to create the Bastion component and then 
use `ssh` to create a tunnel to the database for psql to access.  Once the Bastion
component has been created you can create the ssh tunnel using the hostname from
the Database component's outputs:

```
$ ssh -N -L [port]:[hostname]:[port] ec2-user:[bastion-public-address]
```

Make sure you use the public address of the Bastion in the same accessibility
zone as the database instance.  You can check in the AWS console to see what AZ
the database instance was created in.

With the tunnel running, you can then run psql against localhost with the
correct port to access the database.

First, run `psql` and create the `peer_review` database.

> **Note**
> On locals we create an app user and use that user to create the peer_review
> databsae.  We also do a lot more to lock down the permissions.  Digital Ocean
> doesn't grant us access to the root postgres use, so we can't lock down
> permissions.  Instead, we're just going to use the doamdin user they supply.
> Not ideal, but it is what it is.

```bash
$ psql --host localhost --username postgres --dbname defaultdb --port [port] 
Password for user postgres: 
psql (14.4 (Ubuntu 14.4-0ubuntu0.22.04.1))
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

defaultdb=> CREATE DATABASE peer_review;
CREATE DATABASE
```

Then logout.  Next you'll run two `psql` commands to load in the database
schema and the field structure.  From the root repo directory:

```bash
$ psql --host localhost --username postgres --dbname peer_review --port [port] --file="database/permissions.sql"

$ psql --host localhost --username postgres --dbname peer_review --port [port] --file="database/schema.sql"
Password for user postgres:
CREATE TABLE
[... more statements ...]
CREATE TABLE
```

Finally, we'll login using `psql` and use the `\copy` commands to initialize
the fields and their relationships.

```bash
$ psql --host localhost --username postgres --dbname peer_review --port [port]
Password for user postgres:
psql (14.4 (Ubuntu 14.4-0ubuntu0.22.04.1))
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

peer_review=> \copy fields FROM database/dump/fields.csv

peer_review=> \copy field_relationships FROM database/dump/field_relationships.csv
```

At this point, the database is ready to go.

### Initializing Kubernetes

At this point, we need to prepare the Kubernetes cluster before we can push our
deployments.

First you'll need to configure `kubectl` with the context of the AWS EKS cluster.

Run the following command:

```
$ aws eks update-kubeconfig --region region-code --name my-cluster
```

Then you will need to install the AWS Load Balancer Controller and its
dependencies.  The manifests to create the controller are stored alongside the
peer review manifests in `infrastructure/kubernetes/staging/`.  You will need to apply them 
in the following order:

- `aws-load-balancer-controller-service-account.yaml`
- Install cert manager using: `kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.5.4/cert-manager.yaml`
- `aws-load-balancer-controllerv2_4_4_full.yaml`
- `aws-load-balancer-controllerv2_4_4_ingclass.yaml`
- Install the metrics server using: `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`

Next create the secrets by pushing each of the secrets manifests.  We'll need
to edit some of the manifests - or if this is your first time, create them in
the first place.

Create or edit the following secrets manifests.

The database credentials: `infrastructure/kubernetes/staging/secrets/database-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-database-credentials 
type: Opaque
stringData:
  username: app 
  password: <Generated password used to create app user>
  host: <Host from AWS>
  port: <Port configured in AWS>
```

The session secret key: `infrastructure/kubernetes/staging/secrets/session-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-session-secret
type: Opaque
stringData:
  session_secret: <Generate a random key> 
```

The S3 Acess ID and Access Key: `infrastructure/kubernetes/staging/secrets/s3-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-s3-credentials
type: Opaque
stringData:
  access_id: <access id from AWS> 
  access_key: <access key from AWS> 
```

The Postmark secret: `infrastructure/kubernetes/staging/secrets/postmark-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-postmark-secrets
type: Opaque
stringData:
  api_token: <api-token-from-postmark> 
```

The ORCID ID secrets: `infrastructure/kubernetes/staging/secrets/orcid-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-orcid-secrets
type: Opaque
stringData:
  client_id: <client-id from orcid> 
  client_secret: <client-secret from orcid> 
```


Then use `kubectl apply -f <file>` to push the each of the secrets to the
cluster in turn.

Before you create the peer review deployment, add the ELB Readiness Gate label to the default namespace:

```
$ kubectl label namespace default elbv2.k8s.aws/pod-readiness-gate-inject=enabled
```

Finally, you'll need to create the Peer Review deployment.

```
$ kubectl apply -f infrastructure/kubernetes/staging/peer-review.yaml
```

Once you've created the AWS Load Balancer Controller and prepared the secrets
on the cluster, you can push the primary Peer Review manifest.  First you'll
need to update it with the ARN of the Load Balancer Certificate from the
Certificate component.

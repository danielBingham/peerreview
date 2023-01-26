# Creating the Production Infrastructure

The production infrastructure we currently have written is for Digital Ocean.  The
decision to use Digital Ocean over one of the larger cloud providers was based
on DO being simpler in order to get the infrastructure up quick, and having a
much clearer pricing scheme which will help us avoid cost overruns while we're
on a super tight budget.

If we gain traction the plan is to migrate the infrastructure to one or several
of the larger cloud providers, such as AWS or GCP.  We hope to eventually
provide well defined infrastructures that could run against each of the major
cloud providers to allow for easy multi-cloud setup and easy replication of the
infrastructure.

## Digital Ocean Infrastructure

To create the production infrastructure on Digital Ocean, you will first need to
either gain access to the Peer Review account from @danielbingham or you will
need to create your own account in which to create a mirror infrastructure.

> **WARNING** 
> These are the instructions for the production infrastructure. They are here
> as a map for bringing it back up in case it goes down for some reason.
> Unless something has gone horribly wrong, you probably don't want these.  You
> probably want dev or staging.

### Running Terraform

If this is the first time you're going to run terraform for the production
infrastructure,  you'll need to initialize terraform in the production
infrastructure directory.

```bash
$ cd infrastructure/terraform/production
$ terraform init
```
You will then need to create the `.tfvars` file.  In
`infrastructure/terraform/production/cluster`, create a file named
`digitalocean.auto.tfvars`.  You can look in `variables.tf` to see what
variables the production module takes.  Several of them will need to be generated
from the Digital Ocean console.

If you're running in the main account, reach out to @danielbingham for the
values of the `token`, `spaces_account_id`, and `spaces_secret_key`.  If you're
running in a fresh account, follow the instructions below.

Go to the Digital Ocean Console -> API (left hand menu).  Under "Personal
Access Tokens" click "Generate New Token".  Name it "Peer Review" and save it
in your `.tfvars` file.  Under "Spaces access keys" click "Generate New Key".
Record both the `access_id` and the `secret_key` and add them to the `.tfvars`
file.

Your file should look like this when complete:

```terraform
token = "aaa...aaa"
spaces_access_id = "DOaaa...aaa"
spaces_access_key = "aaa...aaa"
region = "nyc3"
```

Once terraform is initialized and your variables are set up, you can run
`terraform plan` to generate the infrastructure plan.

> **Warning**
> We are not currently using shared state of any kind, so if you are preparing
> to run terraform against the main account, you'll need to actually look in
> digital ocean to determine whether it's already been created.  Otherwise you
> will get a naming collision when Terraform attempts to create the project.

If the plan looks good, run `terraform apply` to create the infrastructure.

Terraform apply will take several minutes to run.  Once it is done, you will
have more setup to do.  You'll need to inialize the database with the schema
and fields, and you'll need to commit the manifests to Kubernetes.

### Initializing the Database

To initialize the database, you'll need to acess the Digital Ocean console to
retrieve login credentials, host, and port.  Then you'll need to run `psql` and
do the initial configuration of the database.

First, run `psql` and create the `peer_review` database.

> **Note**
> On locals we create an app user and use that user to create the peer_review
> database.  We also do a lot more to lock down the permissions.  Digital Ocean
> doesn't grant us access to the root postgres user, so we can't lock down
> permissions.  Instead, we're just going to use the doamdin user they supply.
> Not ideal, but it is what it is.

```bash
$ psql --host <host> --username doadmin --dbname defaultdb --port 25060
Password for user doadmin: 
psql (14.4 (Ubuntu 14.4-0ubuntu0.22.04.1))
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

defaultdb=> CREATE DATABASE peer_review;
CREATE DATABASE
```

Then logout.  Next you'll run two `psql` commands to load in the database
schema and the field structure.  From the root repo directory:

```bash
# Import the schema first.
$ psql --host <host> --username doadmin --dbname peer_review --port 25060 --file="database/schema.sql"
Password for user doadmin:
CREATE TABLE
[... more statements ...]
CREATE TABLE

# Then login to the database using psql so you can import the field data.
$ psql --host <host> --username doadmin --dbname peer_review --port 25060 
Password for user doadmin:

# Import the fields dump.  This is the fastest way to do this.
peer_review=> \copy fields FROM database/dump/fields.csv 
COPY 61231

# Import the field_relationships dump.
peer_review=> \copy field_relationships FROM database/dump/field_relationships.csv 
COPY 110788
```

Once you've run these, remove your IP from the Database Firewall. It can always
be added back in at need.

At this point, the database is ready to go.  We'll need to hang on to the
credentials for the doadmin user, because we'll need to supply them to
kubernetes.

### Initializing Kubernetes

At this point, we need to prepare the Kubernetes cluster before we can push our
deployments.

First we'll need to configure kubectl to talk to the cluster.  To do this,
follow the instructions on Digital Ocean for using the `doctl`.

#### Creating and Initializing Secrets

Next create the secrets by pushing each of the secrets manifests.  We'll need
to edit some of the manifests - or if this is your first time, create them in
the first place.

Create or edit the following secrets manifests.

The Digital Ocean Database Connection certificate:
`infrastructure/kubernetes/production/secrets/certificate-secret.yaml`:

You'll need to download the certificate from Digital Ocean, 

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-database-certificate
type: Opaque
stringData:
  certificate.crt: |
    -----BEGIN CERTIFICATE-----
    [... snip ...]
    -----END CERTIFICATE-----

```

The database credentials: `infrastructure/kubernetes/production/secrets/database-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-database-credentials 
type: Opaque
stringData:
  username: doadmin 
  password: <Password from digital ocean>
```

The ORCID credentials: `infrastructure/kubernetes/production/secrets/orcid-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-orcid-secrets
type: Opaque
stringData:
  client_id: <client id> 
  client_secret: <client secret>
```

THe Postmark API key: `infrastructure/kubernetes/production/secrets/postmark-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-postmark-secrets
type: Opaque
stringData:
  api_token: <api token> 
```

The session secret key: `infrastructure/kubernetes/production/secrets/session-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-session-secret
type: Opaque
stringData:
  session_secret: <Generate a random key> 
```

The Spaces Acess ID and Access Key: `infrastructure/kubernetes/production/secrets/spaces-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: peer-review-spaces-credentials
type: Opaque
stringData:
  access_id: <access id> 
  access_key: <access key> 
```

Then use `kubectl apply -f <file>` to push the each of the secrets to the
cluster in turn.

#### Creating the Deployment

Next up you'll need to create the deployment and it's ingress.

You'll need to run `kubectl apply -f <file>` on the following files in the following order:

- `infrastructure/kubernetes/production/peer-review.yaml`


To set up nginx ingress, you'll need to follow this guide: 
https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-with-cert-manager-on-digitalocean-kubernetes





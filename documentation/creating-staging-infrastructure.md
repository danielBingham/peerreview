# Creating the Staging Infrastructure

The staging infrastructure we currently have written is for Digital Ocean.  The
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

To create the staging infrastructure on Digital Ocean, you will first need to
either gain access to the Peer Review account from @danielbingham or you will
need to create your own account in which to create a mirror infrastructure.

> **WARNING** 
> If you're going to be working in the main Peer Review account, please ensure
> that the staging infrastructure is not already up and in use, as the CD
> pipeline will push to it in order to run integration tests.

### Running Terraform

If this is the first time you're going to run terraform for the staging
infrastructure,  you'll need to initialize terraform in the staging
infrastructure directory.

```bash
$ cd infrastructure/terraform/staging
$ terraform init
```
You will then need to create the `.tfvars` file.  In
`infrastructure/terraform/staging/cluster`, create a file named
`digitalocean.auto.tfvars`.  You can look in `variables.tf` to see what
variables the staging module takes.  Several of them will need to be generated
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
> databsae.  We also do a lot more to lock down the permissions.  Digital Ocean
> doesn't grant us access to the root postgres use, so we can't lock down
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
$ psql --host <host> --username app --dbname peer_review --port 25060 --file="database/schema.sql"
Password for user doadmin:
CREATE TABLE
[... more statements ...]
CREATE TABLE
$ psql --host <host> --username app --dbname peer_review --port 25060 --file="database/fields.sql"
Password for user doadmin:
INSERT 0 6
[... more statements ...]
INSERT 0 1
```

At this point, the database is ready to go.  We'll need to hang on to the
credentials for the doadmin user, because we'll need to supply them to
kubernetes.

### Initializing Kubernetes

At this point, we need to prepare the Kubernetes cluster before we can push our
deployments.

Push the deployments using kubectl apply.

Populate the secrets in `infrastructure/kubernetes/staging/secrets` from the
digital ocean console and then push them to kubernetes using kubectl apply.
Create the certificate secret using kubectl create secret.


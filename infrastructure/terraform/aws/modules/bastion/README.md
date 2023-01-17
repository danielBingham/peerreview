# Bastion

To create a tunnel through the bastion to an instance in a private subnet use
the following SSH command:

```
$ ssh -N -L [port]:[private IP]:[port] ec2-user@[bastion ip]
```

This sets up port forwarding with out opening an ssh session on the bastion,
allowing you to run local commands against `[port]` (such as `psql`) that
connect to the remote instance.

Ssh will automatically find the correct key by testing available keys.

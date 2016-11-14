<div align="center">
	<img alt="TensorFlow" src="https://camo.githubusercontent.com/ee91ac3c9f5ad840ebf70b54284498fe0e6ddb92/68747470733a2f2f7777772e74656e736f72666c6f772e6f72672f696d616765732f74665f6c6f676f5f7472616e73702e706e67" />
</div>

# TensorFlow

2048MiB RAM, 2 processors
64GiB VDI
Forward guest port 22 to host port 8022
Hostname: tensorflow
User: brandon
Select OpenSSH server
sudo apt-get update && sudo apt-get upgrade -y

```sh
$ scp ~/.ssh/id_rsa.pub tensorflow:~/authorized_keys
$ ssh tensorflow
$ mkdir .ssh
$ chmod 700 .ssh
$ mv authorized_keys .ssh/
$ chmod 600 .ssh/authorized_keys
$ exit
$ ssh tensorflow
# Should not ask for password
$ sudo vi /etc/sudoers
# Insert `NOPASSWD` on the `%sudo` line before the last `ALL`
$ sudo less /etc/sudoers
# Should not ask for password
$ sudo adduser deploy
# For password, `node -e "console.log(crypto.randomBytes(32).toString('base64'));"`
$ sudo usermod -aG sudo deploy
$ sudo su deploy
$ cd
$ mkdir .ssh
$ chmod 700 .ssh
$ touch .ssh/authorized_keys
$ chmod 600 .ssh/authorized_keys
$ exit
$ sudo sh -c 'cat ~/.ssh/authorized_keys >> /home/deploy/.ssh/authorized_keys'
$ exit
```

Snapshot

```sh
$ ansible-playbook -i server/inventory server/playbook.yml
```

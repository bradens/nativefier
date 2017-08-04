#! /bin/zsh

domain="https://coar.io"
name="Coar"

if [ ! -z "$1" ]
  then
    domain=$1
fi

if [ ! -z "$2" ]
  then
    name=$2
fi

echo "build nativefier deps"
npm run dev-up && npm link

echo "Create apps"
nativefier $domain -n $name -p win32 -e 1.6.5 ~/Dropbox/CoarApps &
nativefier $domain -n $name -e 1.6.5 ~/Dropbox/CoarApps &
nativefier $domain -n $name -p linux -e 1.6.5 ~/Dropbox/CoarApps &
wait

echo "Creating windows installer"

./create_windows_installer $name

echo "Done creating apps"

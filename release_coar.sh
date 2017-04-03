#! /bin/zsh

echo "build nativefier deps"
npm run dev-up && npm link

echo "Create apps"
nativefier "https://coar.io" -n Coar -p win32 -e 1.6.5 ~/Dropbox/CoarApps &
nativefier "https://coar.io" -n Coar -e 1.6.5 ~/Dropbox/CoarApps &
nativefier "https://coar.io" -n Coar -p linux -e 1.6.5 ~/Dropbox/CoarApps &
wait

echo "Creating windows installer"

./create_windows_installer

echo "Done creating apps"
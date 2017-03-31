#! /bin/zsh

echo "build nativefier deps"
npm run dev-up && npm link


echo "Create apps"
nativefier "https://coar.io" -n Coar -p win32 -c ~/Dropbox/CoarApps &
nativefier "https://coar.io" -n Coar -c ~/Dropbox/CoarApps &
nativefier "https://coar.io" -n Coar -c -p linux ~/Dropbox/CoarApps &
wait

echo "Creating windows installer"

./create_windows_installer

echo "Done creating apps"
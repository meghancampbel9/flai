#!/bin/bash

# Script to fix navigation issues in user components

echo "🔧 Fixing navigation issues in user components..."

# Fix UserFollowersScreen
echo "Fixing UserFollowersScreen..."
sed -i 's/import { userFollowingService, UserProfile } from/import { useRouter, useLocalSearchParams } from "expo-router";\nimport { userFollowingService, UserProfile } from/' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowersScreen.tsx

sed -i 's/export const UserFollowersScreen: React.FC<UserFollowersScreenProps> = ({ navigation, route }) => {/export const UserFollowersScreen: React.FC = () => {\n  const router = useRouter();\n  const { userId } = useLocalSearchParams<{ userId: string }>();/' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowersScreen.tsx

sed -i 's/navigation.navigate('\''UserProfile'\'', { userId: user.user_id });/router.push(`\/user-profile?userId=${user.user_id}`);/' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowersScreen.tsx

sed -i 's/navigation.goBack()/router.back()/g' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowersScreen.tsx

# Fix UserFollowingScreen
echo "Fixing UserFollowingScreen..."
sed -i 's/import { userFollowingService, UserProfile } from/import { useRouter, useLocalSearchParams } from "expo-router";\nimport { userFollowingService, UserProfile } from/' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowingScreen.tsx

sed -i 's/export const UserFollowingScreen: React.FC<UserFollowingScreenProps> = ({ navigation, route }) => {/export const UserFollowingScreen: React.FC = () => {\n  const router = useRouter();\n  const { userId } = useLocalSearchParams<{ userId: string }>();/' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowingScreen.tsx

sed -i 's/navigation.navigate('\''UserProfile'\'', { userId: user.user_id });/router.push(`\/user-profile?userId=${user.user_id}`);/' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowingScreen.tsx

sed -i 's/navigation.goBack()/router.back()/g' /home/meg/dev/flai/apps/mobile/src/features/user/components/UserFollowingScreen.tsx

echo "✅ Navigation fixes applied!"



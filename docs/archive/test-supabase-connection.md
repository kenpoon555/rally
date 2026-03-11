# Quick Supabase Connection Test

## Test 1: App Launch Test

1. **Build and run**:
   ```bash
   cd RallyApp
   npm install
   cd ios && pod install && cd ..
   npm run ios
   ```

2. **Expected**: App should launch and show login screen (no crashes)

3. **If it crashes**: Check console for errors related to Supabase config

## Test 2: Sign Up Test

1. **In the app**:
   - Tap "Sign Up" or "Create Account"
   - Enter:
     - Email: `test@example.com`
     - Password: `test123456`
     - Username: `testuser`
   - Tap "Sign Up"

2. **Expected**: 
   - Should create account successfully
   - Should navigate to main app (home screen)

3. **Verify in Supabase**:
   - Go to https://supabase.com/dashboard
   - Select project: `Rally`
   - Go to "Authentication" > "Users"
   - Should see `test@example.com`
   - Go to "Table Editor" > "users"
   - Should see user with username `testuser`

## Test 3: Login Test

1. **Log out** (if logged in)
2. **Log in** with:
   - Email: `test@example.com`
   - Password: `test123456`

3. **Expected**: Should log in successfully

## Test 4: Database Query Test

Once logged in, the app should:
- Load user profile (check console for errors)
- Try to fetch activities (may be empty, but shouldn't error)
- Check Supabase dashboard > "Logs" for any errors

## Common Issues

### Issue: "Missing Supabase configuration"
**Fix**: Check `src/constants/config.ts` has valid SUPABASE_URL and SUPABASE_ANON_KEY

### Issue: "Invalid API key"
**Fix**: 
- Copy keys again from Supabase dashboard
- Make sure no extra spaces
- Verify project is active

### Issue: "RLS policy violation"
**Fix**: 
- This is normal for some operations
- Check RLS policies in Supabase SQL Editor
- User should be able to create their own profile

### Issue: App crashes on launch
**Check**:
- All dependencies installed: `npm install`
- iOS pods installed: `cd ios && pod install`
- No TypeScript errors: `npm run lint`

## Success Criteria

✅ App launches without errors
✅ Can sign up new user
✅ User appears in Supabase
✅ Can log in
✅ No Supabase connection errors in console

If all pass, Supabase connection is working! ✅

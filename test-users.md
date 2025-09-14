# Test User Registration Data

Use these sample users to test the registration workflow:

## Test User 1 - Seller
```
First Name: Maria
Last Name: Santos
Email: maria.santos@email.com
Phone: +639171234567
Password: testpass123
Role: Seller
City: Quezon City
Region: Metro Manila
```

## Test User 2 - Buyer
```
First Name: Juan
Last Name: Dela Cruz
Email: juan.delacruz@email.com
Phone: +639181234567
Password: testpass123
Role: Buyer
City: Makati
Region: Metro Manila
```

## Test User 3 - Seller (Different Region)
```
First Name: Ana
Last Name: Reyes
Email: ana.reyes@email.com
Phone: +639191234567
Password: testpass123
Role: Seller
City: Cebu City
Region: Cebu
```

## Test User 4 - Invalid Phone (for error testing)
```
First Name: Test
Last Name: Error
Email: test.error@email.com
Phone: 123456789 (invalid format)
Password: testpass123
Role: Buyer
City: Manila
Region: Metro Manila
```

## Database Status After Cleanup:
- ✅ Users: 1 (admin only)
- ✅ Products: 0 (all cleaned)
- ✅ Fresh database ready for testing

## Testing Workflow:
1. **Register new users** using the sample data above
2. **Check admin approval system** - new users should be `isActive: false`
3. **Test admin approval** - login as admin and approve users
4. **Test login after approval** - users should be able to login
5. **Test product creation** - approved sellers can create products
6. **Test product approval** - admin can approve/reject products
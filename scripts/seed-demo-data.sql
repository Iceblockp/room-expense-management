-- Demo data for Room Expense Manager
-- This script creates sample data for testing and demonstration

-- Insert demo users (these would normally be created through registration)
INSERT INTO users (id, name, email, password, "createdAt") VALUES
('demo-user-1', 'Alice Johnson', 'alice@example.com', '$2a$12$demo.hash.here', NOW()),
('demo-user-2', 'Bob Smith', 'bob@example.com', '$2a$12$demo.hash.here', NOW()),
('demo-user-3', 'Carol Davis', 'carol@example.com', '$2a$12$demo.hash.here', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert demo room
INSERT INTO rooms (id, name, "createdAt") VALUES
('demo-room-1', 'Apartment 4B - Demo Room', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert memberships
INSERT INTO memberships (id, "userId", "roomId", role, "joinedAt") VALUES
('demo-membership-1', 'demo-user-1', 'demo-room-1', 'ADMIN', NOW()),
('demo-membership-2', 'demo-user-2', 'demo-room-1', 'MEMBER', NOW()),
('demo-membership-3', 'demo-user-3', 'demo-room-1', 'MEMBER', NOW())
ON CONFLICT ("userId", "roomId") DO NOTHING;

-- Insert a cleared round with historical data
INSERT INTO rounds (id, "roomId", status, "createdAt", "clearedAt") VALUES
('demo-round-1', 'demo-room-1', 'CLEARED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Insert historical expenses for the cleared round
INSERT INTO expenses (id, "roomId", "roundId", "payerId", title, amount, notes, "createdAt", "createdBy") VALUES
('demo-expense-1', 'demo-room-1', 'demo-round-1', 'demo-user-1', 'Groceries - Week 1', 85.50, 'Whole Foods shopping', NOW() - INTERVAL '25 days', 'demo-user-1'),
('demo-expense-2', 'demo-room-1', 'demo-round-1', 'demo-user-2', 'Electricity Bill', 120.00, 'Monthly utility bill', NOW() - INTERVAL '20 days', 'demo-user-2'),
('demo-expense-3', 'demo-room-1', 'demo-round-1', 'demo-user-3', 'Internet Bill', 60.00, 'Monthly internet service', NOW() - INTERVAL '18 days', 'demo-user-3'),
('demo-expense-4', 'demo-room-1', 'demo-round-1', 'demo-user-1', 'Cleaning Supplies', 35.75, 'Bathroom and kitchen supplies', NOW() - INTERVAL '15 days', 'demo-user-1'),
('demo-expense-5', 'demo-room-1', 'demo-round-1', 'demo-user-2', 'Pizza Night', 42.50, 'Friday dinner for everyone', NOW() - INTERVAL '10 days', 'demo-user-2')
ON CONFLICT (id) DO NOTHING;

-- Insert historical settlements for the cleared round
INSERT INTO settlements (id, "roomId", "roundId", "fromUserId", "toUserId", amount, status, "createdAt") VALUES
('demo-settlement-1', 'demo-room-1', 'demo-round-1', 'demo-user-3', 'demo-user-1', 26.92, 'CONFIRMED', NOW() - INTERVAL '8 days'),
('demo-settlement-2', 'demo-room-1', 'demo-round-1', 'demo-user-2', 'demo-user-1', 13.42, 'CONFIRMED', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Insert current open round
INSERT INTO rounds (id, "roomId", status, "createdAt") VALUES
('demo-round-2', 'demo-room-1', 'OPEN', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Insert current expenses
INSERT INTO expenses (id, "roomId", "roundId", "payerId", title, amount, notes, "createdAt", "createdBy") VALUES
('demo-expense-6', 'demo-room-1', 'demo-round-2', 'demo-user-2', 'Groceries - Week 2', 92.30, 'Costco bulk shopping', NOW() - INTERVAL '5 days', 'demo-user-2'),
('demo-expense-7', 'demo-room-1', 'demo-round-2', 'demo-user-3', 'Gas Bill', 45.80, 'Monthly gas utility', NOW() - INTERVAL '3 days', 'demo-user-3'),
('demo-expense-8', 'demo-room-1', 'demo-round-2', 'demo-user-1', 'Takeout Dinner', 38.25, 'Thai food for the group', NOW() - INTERVAL '1 day', 'demo-user-1')
ON CONFLICT (id) DO NOTHING;

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

describe('Personal Cashbook API Endpoints', () => {
  let authToken = '';
  let bankWalletId = '';
  let cashWalletId = '';
  let salaryCatId = '';

  beforeAll(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/personal_cashbook_api_test';
    await connectDatabase();
    await mongoose.connection.dropDatabase();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await disconnectDatabase();
    }
  });

  it('Health check endpoint returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('Registers a new user and auto-seeds default categories & wallets', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Arjun Gupta',
        email: 'arjun@example.com',
        password: 'Password123!',
        currency: 'INR'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.name).toBe('Arjun Gupta');

    authToken = res.body.data.token;
  });

  it('Retrieves auto-seeded wallets for user', async () => {
    const res = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    const bank = res.body.data.find((w) => w.type === 'bank');
    const cash = res.body.data.find((w) => w.type === 'cash');
    expect(bank).toBeDefined();
    expect(cash).toBeDefined();

    bankWalletId = bank._id;
    cashWalletId = cash._id;
  });

  it('Retrieves auto-seeded categories for user', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);

    const salary = res.body.data.find((c) => c.name === 'Salary');
    expect(salary).toBeDefined();
    salaryCatId = salary._id;
  });

  it('Creates an income transaction and updates wallet balance', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'income',
        amountMinor: 8500000, // ₹85,000.00
        walletId: bankWalletId,
        categoryId: salaryCatId,
        description: 'October Salary'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amountMinor).toBe(8500000);

    // Verify wallet current balance
    const walletRes = await request(app)
      .get(`/api/wallets/${bankWalletId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(walletRes.body.data.currentBalanceMinor).toBe(8500000);
  });

  it('Creates a transfer between wallets', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'transfer',
        amountMinor: 1000000, // ₹10,000.00
        walletId: bankWalletId,
        destinationWalletId: cashWalletId,
        description: 'Withdraw cash for pocket expenses'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Bank should have 85,000 - 10,000 = 75,000 (7,500,000 paise)
    const bankRes = await request(app)
      .get(`/api/wallets/${bankWalletId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(bankRes.body.data.currentBalanceMinor).toBe(7500000);

    // Cash should have 0 + 10,000 = 10,000 (1,000,000 paise)
    const cashRes = await request(app)
      .get(`/api/wallets/${cashWalletId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(cashRes.body.data.currentBalanceMinor).toBe(1000000);
  });

  it('Exports transactions as CSV', async () => {
    const res = await request(app)
      .get('/api/export/download?format=csv&type=transactions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('October Salary');
    expect(res.text).toContain('Withdraw cash for pocket expenses');
  });

  it('Exports financial report as PDF', async () => {
    const res = await request(app)
      .get('/api/export/download?format=pdf')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});

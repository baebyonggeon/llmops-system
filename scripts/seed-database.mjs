#!/usr/bin/env node

/**
 * Database Seeding Script for LLMOps System
 * 
 * This script:
 * 1. Connects to RDS PostgreSQL database
 * 2. Creates all tables using Drizzle schema
 * 3. Inserts sample data for testing
 * 
 * Usage:
 *   node scripts/seed-database.mjs
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../drizzle/schema.ts';

// Database connection configuration
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres:llm1234!@prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432/llmops';

console.log('🚀 Starting database seeding process...\n');

// Create connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // For RDS connections
  }
});

const db = drizzle(pool, { schema });

async function seedDatabase() {
  try {
    console.log('📡 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established\n');

    // ==========================================
    // 1. Insert Common Codes
    // ==========================================
    console.log('📝 Inserting common codes...');
    
    const commonCodes = [
      // Member Type Codes
      { lcffCd: 'MBR_TYPE', sclffCd: 'ADMIN', lcffNm: 'Member Type', sclffNm: 'Administrator' },
      { lcffCd: 'MBR_TYPE', sclffCd: 'USER', lcffNm: 'Member Type', sclffNm: 'General User' },
      { lcffCd: 'MBR_TYPE', sclffCd: 'DEVELOPER', lcffNm: 'Member Type', sclffNm: 'Developer' },
      
      // Member Status Codes
      { lcffCd: 'MBR_STTUS', sclffCd: 'ACTIVE', lcffNm: 'Member Status', sclffNm: 'Active' },
      { lcffCd: 'MBR_STTUS', sclffCd: 'INACTIVE', lcffNm: 'Member Status', sclffNm: 'Inactive' },
      { lcffCd: 'MBR_STTUS', sclffCd: 'SUSPENDED', lcffNm: 'Member Status', sclffNm: 'Suspended' },
      
      // Project State Codes
      { lcffCd: 'PJT_STATE', sclffCd: 'ACTIVE', lcffNm: 'Project State', sclffNm: 'Active' },
      { lcffCd: 'PJT_STATE', sclffCd: 'COMPLETED', lcffNm: 'Project State', sclffNm: 'Completed' },
      { lcffCd: 'PJT_STATE', sclffCd: 'ARCHIVED', lcffNm: 'Project State', sclffNm: 'Archived' },
      
      // Deployment Status Codes
      { lcffCd: 'DP_STTUS', sclffCd: 'RUNNING', lcffNm: 'Deployment Status', sclffNm: 'Running' },
      { lcffCd: 'DP_STTUS', sclffCd: 'STOPPED', lcffNm: 'Deployment Status', sclffNm: 'Stopped' },
      { lcffCd: 'DP_STTUS', sclffCd: 'FAILED', lcffNm: 'Deployment Status', sclffNm: 'Failed' },
      
      // Model Type Codes
      { lcffCd: 'MDL_TYPE', sclffCd: 'LLM', lcffNm: 'Model Type', sclffNm: 'Large Language Model' },
      { lcffCd: 'MDL_TYPE', sclffCd: 'CV', lcffNm: 'Model Type', sclffNm: 'Computer Vision' },
      { lcffCd: 'MDL_TYPE', sclffCd: 'NLP', lcffNm: 'Model Type', sclffNm: 'Natural Language Processing' },
    ];

    for (const code of commonCodes) {
      await db.insert(schema.sysComCd).values(code).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${commonCodes.length} common codes\n`);

    // ==========================================
    // 2. Insert Sample Members
    // ==========================================
    console.log('👥 Inserting sample members...');
    
    const members = [
      {
        custCd: 'CUST001',
        mbrTypeCd: 'ADMIN',
        id: 'admin@llmops.com',
        mbrNm: 'System Administrator',
        pwd: '$2a$10$YourHashedPasswordHere', // In production, use bcrypt
        mbrUuid: 'uuid-admin-001',
        mbrSttusCd: 'ACTIVE',
        mbrClassId: 'CLASS_A',
        phoneNumber: '010-1234-5678',
        emailAthn: 'admin@llmops.com',
        crtrId: 'system',
      },
      {
        custCd: 'CUST001',
        mbrTypeCd: 'DEVELOPER',
        id: 'dev1@llmops.com',
        mbrNm: 'John Developer',
        pwd: '$2a$10$YourHashedPasswordHere',
        mbrUuid: 'uuid-dev-001',
        mbrSttusCd: 'ACTIVE',
        mbrClassId: 'CLASS_B',
        phoneNumber: '010-2345-6789',
        emailAthn: 'dev1@llmops.com',
        crtrId: 'admin',
      },
      {
        custCd: 'CUST001',
        mbrTypeCd: 'USER',
        id: 'user1@llmops.com',
        mbrNm: 'Jane User',
        pwd: '$2a$10$YourHashedPasswordHere',
        mbrUuid: 'uuid-user-001',
        mbrSttusCd: 'ACTIVE',
        mbrClassId: 'CLASS_C',
        phoneNumber: '010-3456-7890',
        emailAthn: 'user1@llmops.com',
        crtrId: 'admin',
      },
    ];

    for (const member of members) {
      await db.insert(schema.mbrBas).values(member).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${members.length} members\n`);

    // ==========================================
    // 3. Insert Sample Projects
    // ==========================================
    console.log('📁 Inserting sample projects...');
    
    const projects = [
      {
        custCd: 'CUST001',
        pjtNm: 'GPT-4 Chatbot Development',
        pjtDscrt: 'Building an intelligent chatbot using GPT-4 for customer service automation',
        stateCd: 'ACTIVE',
        pjtUuid: 'uuid-pjt-001',
        crtrId: 'admin',
      },
      {
        custCd: 'CUST001',
        pjtNm: 'Image Classification System',
        pjtDscrt: 'Computer vision model for automated product classification',
        stateCd: 'ACTIVE',
        pjtUuid: 'uuid-pjt-002',
        crtrId: 'admin',
      },
      {
        custCd: 'CUST001',
        pjtNm: 'Sentiment Analysis API',
        pjtDscrt: 'NLP-based sentiment analysis service for social media monitoring',
        stateCd: 'COMPLETED',
        pjtUuid: 'uuid-pjt-003',
        crtrId: 'dev1@llmops.com',
      },
    ];

    const insertedProjects = [];
    for (const project of projects) {
      const result = await db.insert(schema.pjtBas).values(project).returning();
      insertedProjects.push(result[0]);
    }
    console.log(`✅ Inserted ${projects.length} projects\n`);

    // ==========================================
    // 4. Insert Project Member Mappings
    // ==========================================
    console.log('🔗 Inserting project member mappings...');
    
    const projectMappings = [
      {
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        mbrUuid: 'uuid-admin-001',
        auth: 'OWNER',
        favYn: 'Y',
        mbrTypeCd: 'ADMIN',
        crtrId: 'system',
      },
      {
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        mbrUuid: 'uuid-dev-001',
        auth: 'EDITOR',
        favYn: 'Y',
        mbrTypeCd: 'DEVELOPER',
        crtrId: 'admin',
      },
      {
        pjtId: insertedProjects[1].pjtId,
        custCd: 'CUST001',
        mbrUuid: 'uuid-dev-001',
        auth: 'OWNER',
        favYn: 'Y',
        mbrTypeCd: 'DEVELOPER',
        crtrId: 'admin',
      },
    ];

    for (const mapping of projectMappings) {
      await db.insert(schema.pjtMbrAutMap).values(mapping).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${projectMappings.length} project member mappings\n`);

    // ==========================================
    // 5. Insert Sample Models
    // ==========================================
    console.log('🤖 Inserting sample models...');
    
    const models = [
      {
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        llmNm: 'GPT-4-Turbo',
        llmDscrt: 'Latest GPT-4 Turbo model with improved performance',
        llmVer: '1.0.0',
        llmType: 'LLM',
        llmSttus: 'ACTIVE',
        llmUuid: 'uuid-llm-001',
        crtrId: 'dev1@llmops.com',
      },
      {
        pjtId: insertedProjects[1].pjtId,
        custCd: 'CUST001',
        llmNm: 'ResNet-50',
        llmDscrt: 'Deep residual network for image classification',
        llmVer: '2.1.0',
        llmType: 'CV',
        llmSttus: 'ACTIVE',
        llmUuid: 'uuid-llm-002',
        crtrId: 'dev1@llmops.com',
      },
      {
        pjtId: insertedProjects[2].pjtId,
        custCd: 'CUST001',
        llmNm: 'BERT-Base',
        llmDscrt: 'Bidirectional encoder representations from transformers',
        llmVer: '1.5.0',
        llmType: 'NLP',
        llmSttus: 'COMPLETED',
        llmUuid: 'uuid-llm-003',
        crtrId: 'dev1@llmops.com',
      },
    ];

    const insertedModels = [];
    for (const model of models) {
      const result = await db.insert(schema.llmBas).values(model).returning();
      insertedModels.push(result[0]);
    }
    console.log(`✅ Inserted ${models.length} models\n`);

    // ==========================================
    // 6. Insert Sample Model Catalog
    // ==========================================
    console.log('📚 Inserting model catalog entries...');
    
    const catalogEntries = [
      {
        llmId: insertedModels[0].llmId,
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        catalogNm: 'GPT-4-Turbo-v1',
        catalogDscrt: 'Production-ready GPT-4 Turbo model',
        catalogVer: '1.0.0',
        catalogPath: 's3://llmops-models/gpt4-turbo/v1.0.0',
        catalogSize: '175000000000', // 175GB
        catalogFormat: 'PyTorch',
        crtrId: 'dev1@llmops.com',
      },
      {
        llmId: insertedModels[1].llmId,
        pjtId: insertedProjects[1].pjtId,
        custCd: 'CUST001',
        catalogNm: 'ResNet-50-Trained',
        catalogDscrt: 'Fine-tuned ResNet-50 for product classification',
        catalogVer: '2.1.0',
        catalogPath: 's3://llmops-models/resnet50/v2.1.0',
        catalogSize: '102000000', // 102MB
        catalogFormat: 'ONNX',
        crtrId: 'dev1@llmops.com',
      },
    ];

    for (const entry of catalogEntries) {
      await db.insert(schema.mdlCatalog).values(entry).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${catalogEntries.length} catalog entries\n`);

    // ==========================================
    // 7. Insert Sample Deployments
    // ==========================================
    console.log('🚀 Inserting sample deployments...');
    
    const deployments = [
      {
        llmId: insertedModels[0].llmId,
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        dpNm: 'GPT-4-Production',
        dpDscrt: 'Production deployment of GPT-4 chatbot',
        dpSttus: 'RUNNING',
        dpVer: '1.0.0',
        dpUrl: 'https://api.llmops.com/gpt4',
        dpPort: '8080',
        dpUuid: 'uuid-dp-001',
        crtrId: 'dev1@llmops.com',
      },
      {
        llmId: insertedModels[1].llmId,
        pjtId: insertedProjects[1].pjtId,
        custCd: 'CUST001',
        dpNm: 'ResNet-Staging',
        dpDscrt: 'Staging deployment for testing',
        dpSttus: 'RUNNING',
        dpVer: '2.1.0',
        dpUrl: 'https://staging.llmops.com/resnet',
        dpPort: '8081',
        dpUuid: 'uuid-dp-002',
        crtrId: 'dev1@llmops.com',
      },
    ];

    const insertedDeployments = [];
    for (const deployment of deployments) {
      const result = await db.insert(schema.dpBas).values(deployment).returning();
      insertedDeployments.push(result[0]);
    }
    console.log(`✅ Inserted ${deployments.length} deployments\n`);

    // ==========================================
    // 8. Insert Sample APIs
    // ==========================================
    console.log('🔌 Inserting sample APIs...');
    
    const apis = [
      {
        dpId: insertedDeployments[0].dpId,
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        apiNm: 'Chat Completion API',
        apiDscrt: 'GPT-4 chat completion endpoint',
        apiUrl: 'https://api.llmops.com/gpt4/chat',
        apiMthd: 'POST',
        apiSttus: 'ACTIVE',
        apiVer: '1.0.0',
        apiUuid: 'uuid-api-001',
        crtrId: 'dev1@llmops.com',
      },
      {
        dpId: insertedDeployments[1].dpId,
        pjtId: insertedProjects[1].pjtId,
        custCd: 'CUST001',
        apiNm: 'Image Classification API',
        apiDscrt: 'ResNet-50 image classification endpoint',
        apiUrl: 'https://staging.llmops.com/resnet/classify',
        apiMthd: 'POST',
        apiSttus: 'ACTIVE',
        apiVer: '2.1.0',
        apiUuid: 'uuid-api-002',
        crtrId: 'dev1@llmops.com',
      },
    ];

    const insertedApis = [];
    for (const api of apis) {
      const result = await db.insert(schema.apiBas).values(api).returning();
      insertedApis.push(result[0]);
    }
    console.log(`✅ Inserted ${apis.length} APIs\n`);

    // ==========================================
    // 9. Insert Sample API Keys
    // ==========================================
    console.log('🔑 Inserting sample API keys...');
    
    const apiKeys = [
      {
        apiId: insertedApis[0].apiId,
        pjtId: insertedProjects[0].pjtId,
        custCd: 'CUST001',
        apiKeyNm: 'Production Key 1',
        apiKeyVal: 'llmops_prod_key_1234567890abcdef',
        apiKeySttus: 'ACTIVE',
        apiKeyExpDt: new Date('2025-12-31'),
        apiKeyUuid: 'uuid-apikey-001',
        crtrId: 'admin',
      },
      {
        apiId: insertedApis[1].apiId,
        pjtId: insertedProjects[1].pjtId,
        custCd: 'CUST001',
        apiKeyNm: 'Staging Key 1',
        apiKeyVal: 'llmops_stag_key_abcdef1234567890',
        apiKeySttus: 'ACTIVE',
        apiKeyExpDt: new Date('2025-06-30'),
        apiKeyUuid: 'uuid-apikey-002',
        crtrId: 'dev1@llmops.com',
      },
    ];

    for (const apiKey of apiKeys) {
      await db.insert(schema.apikeyBas).values(apiKey).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${apiKeys.length} API keys\n`);

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Common Codes: ${commonCodes.length}`);
    console.log(`   - Members: ${members.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Project Mappings: ${projectMappings.length}`);
    console.log(`   - Models: ${models.length}`);
    console.log(`   - Catalog Entries: ${catalogEntries.length}`);
    console.log(`   - Deployments: ${deployments.length}`);
    console.log(`   - APIs: ${apis.length}`);
    console.log(`   - API Keys: ${apiKeys.length}`);
    console.log('\n✅ All sample data has been inserted successfully!');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seeding script
seedDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

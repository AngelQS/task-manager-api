import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return status ok and current NODE_ENV', () => {
    process.env.NODE_ENV = 'test';
    const result = controller.check();
    expect(result).toEqual({ status: 'ok', environment: 'test' });
  });
});

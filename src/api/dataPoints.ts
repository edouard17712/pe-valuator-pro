import { prisma } from '../lib/db';
import { DataPoint } from '../types/dataPoint';

export async function createDataPoint(dataPoint: Omit<DataPoint, 'id' | 'date'>) {
  return prisma.dataPoint.create({
    data: {
      ...dataPoint,
      date: new Date(),
      provider: {
        connect: { id: parseInt(dataPoint.provider) }
      }
    },
    include: {
      provider: true
    }
  });
}

export async function fetchDataPoints() {
  return prisma.dataPoint.findMany({
    include: {
      provider: true
    },
    orderBy: {
      date: 'desc'
    }
  });
}
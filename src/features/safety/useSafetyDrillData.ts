import { useState, useEffect } from 'react';
import { db } from '../../lib/rxdb';
import { SafetyDrill, Incident, IncidentSeverity, IncidentType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useSafetyDrillData() {
  const [drills, setDrills] = useState<SafetyDrill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const sub = db.incidents.find({
      selector: { 
        is_deleted: { $eq: false },
        category: { $eq: 'safety_drill' }
      },
      sort: [{ date: 'desc' }]
    }).$.subscribe(docs => {
      setDrills(docs.map(d => d.toJSON() as SafetyDrill));
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, []);

  const addDrillLog = async (drill: Omit<SafetyDrill, 'id'>) => {
    const newDrill: Incident = {
      ...drill,
      id: uuidv4(),
      category: 'safety_drill',
      updated_at: new Date().toISOString(),
      is_deleted: false,
      status: 'Completed',
      severity: IncidentSeverity.LOW,
      type: IncidentType.OTHER,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      reported_by: 'SYS'
    };
    await db.incidents.upsert(newDrill);
  };

  const deleteDrillLog = async (id: string) => {
    const drillDoc = await db.incidents.findOne(id).exec();
    if (drillDoc) {
      const drill = drillDoc.toJSON();
      await db.incidents.upsert({
        ...drill,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    drills,
    isLoading,
    addDrillLog,
    deleteDrillLog
  };
}

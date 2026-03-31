import { useState, useEffect } from 'react';
import { db } from '../../lib/rxdb';
import { FirstAidLog, Incident, IncidentSeverity, IncidentType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useFirstAidData() {
  const [logs, setLogs] = useState<FirstAidLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const sub = db.incidents.find({
      selector: { 
        is_deleted: { $eq: false },
        category: { $eq: 'first_aid' }
      },
      sort: [{ date: 'desc' }]
    }).$.subscribe(docs => {
      setLogs(docs.map(d => d.toJSON() as FirstAidLog));
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, []);

  const addFirstAid = async (log: Omit<FirstAidLog, 'id'>) => {
    const newLog: Incident = {
      ...log,
      id: uuidv4(),
      category: 'first_aid',
      updated_at: new Date().toISOString(),
      is_deleted: false,
      status: 'Completed',
      severity: IncidentSeverity.LOW,
      type: log.type as unknown as IncidentType,
      reported_by: 'SYS'
    };
    await db.incidents.upsert(newLog);
  };

  const deleteFirstAid = async (id: string) => {
    const logDoc = await db.incidents.findOne(id).exec();
    if (logDoc) {
      const log = logDoc.toJSON();
      await db.incidents.upsert({
        ...log,
        is_deleted: true,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    logs,
    isLoading,
    addFirstAid,
    deleteFirstAid
  };
}

import { fetchApiData } from '/utils/api.js';

/**
 * @returns {Promise<number>}
 */
export async function getBatteryPrediction() {
  let batteryChange = 0;

  const dailyEnd = new Date();
  dailyEnd.setHours(0, 0, 0, 0);
  dailyEnd.setDate(dailyEnd.getDate() - 1);
  const dailyStart = new Date(dailyEnd);
  dailyStart.setDate(dailyStart.getDate() - 7);
  await fetchApiData(
    '/daily?start=' + dailyStart.getTime() + '&end=' + dailyEnd.getTime(),
    (/** @type {DailyResponse[]} */ daily) => {
      const lastWeek = daily.map(
        (item, index) => index < daily.length - 1
          ? Math.max(
            0,
            -(daily[index + 1].energy.toBattery - item.energy.toBattery - (
              daily[index + 1].energy.fromBattery - item.energy.fromBattery
            ))
          )
          : 0
      )
        .slice(0, -1)
        .sort((first, second) => first - second);
      batteryChange = lastWeek[
        Math.round(lastWeek.length / 2)
      ];
    }
  );

  return batteryChange;
}

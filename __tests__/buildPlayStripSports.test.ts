import {
  PLAY_STRIP_SPORT_MAX,
  buildPersonalizedSportOrder,
  buildPlayStripSports,
  bumpPreferredSportsMru,
} from '../src/utils/buildPlayStripSports';
import { SportType } from '../src/constants/sports';

const catalog = [
  { id: '1', name: SportType.PICKLEBALL },
  { id: '2', name: SportType.BASKETBALL },
  { id: '3', name: SportType.BADMINTON },
  { id: '4', name: SportType.TENNIS },
  { id: '5', name: SportType.VOLLEYBALL },
  { id: '6', name: SportType.SOCCER },
  { id: '7', name: SportType.RUNNING },
  { id: '8', name: SportType.RACQUETBALL },
];

describe('bumpPreferredSportsMru', () => {
  it('promotes selected sport to front', () => {
    expect(bumpPreferredSportsMru([SportType.PICKLEBALL, SportType.BADMINTON], SportType.RUNNING)).toEqual([
      SportType.RUNNING,
      SportType.PICKLEBALL,
      SportType.BADMINTON,
    ]);
  });

  it('dedupes and caps at five', () => {
    const current = [
      SportType.SOCCER,
      SportType.RUNNING,
      SportType.RACQUETBALL,
      SportType.TABLE_TENNIS,
      SportType.ULTIMATE,
    ];
    expect(bumpPreferredSportsMru(current, SportType.RUNNING)).toEqual([
      SportType.RUNNING,
      SportType.SOCCER,
      SportType.RACQUETBALL,
      SportType.TABLE_TENNIS,
      SportType.ULTIMATE,
    ]);
  });
});

describe('buildPlayStripSports', () => {
  it('keeps multiple MRU sports visible for power host', () => {
    const { stripSports } = buildPlayStripSports({
      catalogSports: catalog,
      selectedSport: SportType.SOCCER,
      preferredSports: [SportType.SOCCER, SportType.RUNNING, SportType.RACQUETBALL],
      attendedSports: [SportType.BADMINTON, SportType.PICKLEBALL, SportType.BASKETBALL],
    });

    expect(stripSports.map((sport) => sport.name)).toEqual([
      SportType.SOCCER,
      SportType.RUNNING,
      SportType.RACQUETBALL,
      SportType.BADMINTON,
      SportType.PICKLEBALL,
    ]);
  });

  it('puts selected badminton first for casual player with attendance', () => {
    const { stripSports } = buildPlayStripSports({
      catalogSports: catalog,
      selectedSport: SportType.BADMINTON,
      preferredSports: [SportType.BADMINTON],
      attendedSports: [SportType.BADMINTON, SportType.BASKETBALL, SportType.PICKLEBALL],
    });

    expect(stripSports[0].name).toBe(SportType.BADMINTON);
    expect(stripSports.map((sport) => sport.name)).not.toEqual([
      SportType.PICKLEBALL,
      SportType.BASKETBALL,
      SportType.BADMINTON,
    ]);
  });

  it('shows More when catalog exceeds visible strip', () => {
    const { stripSports, showMore } = buildPlayStripSports({
      catalogSports: catalog,
      selectedSport: SportType.PICKLEBALL,
      preferredSports: [SportType.PICKLEBALL],
      attendedSports: [],
    });

    expect(stripSports.length).toBe(PLAY_STRIP_SPORT_MAX);
    expect(showMore).toBe(true);
  });

  it('orders selected then MRU then attended', () => {
    const order = buildPersonalizedSportOrder({
      selectedSport: SportType.RUNNING,
      preferredSports: [SportType.SOCCER, SportType.RUNNING],
      attendedSports: [SportType.BADMINTON, SportType.PICKLEBALL],
      catalogOrder: catalog.map((sport) => sport.name),
    });

    expect(order.slice(0, 4)).toEqual([
      SportType.RUNNING,
      SportType.SOCCER,
      SportType.BADMINTON,
      SportType.PICKLEBALL,
    ]);
  });
});

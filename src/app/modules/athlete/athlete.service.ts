import { FightingStatus, Gender, JoinStatus, Prisma } from '@prisma/client';
import prisma from '../../helpers/prisma';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';
import { notificationServices } from '../notifications/notification.service';
import { getDistance } from 'geolib';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { ratingService } from '../rating/rating.service';

interface NotificationBody {
  title: string;
  body: string;
}
export type Filters = {
  search?: string;
  martialArts?: string;
  fighting?: FightingStatus;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  minWeight?: number;
  maxWeight?: number;
  gender?: Gender;
  minDistance?: number;
  maxDistance?: number;
  userLatitude?: number;
  userLongitude?: number;
};

const calculateDistance = (
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined,
): number | null => {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return null;
  }

  const lat1Num = Number(lat1);
  const lon1Num = Number(lon1);
  const lat2Num = Number(lat2);
  const lon2Num = Number(lon2);

  if (isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
    console.error('Invalid number conversion:', { lat1, lon1, lat2, lon2 });
    return null;
  }

  return getDistance(
    { latitude: lat1Num, longitude: lon1Num },
    { latitude: lat2Num, longitude: lon2Num },
  );
};

const getAthlete = async (athleteId: string) => {
  const athlete = await prisma.athlete.findUnique({
    where: {
      id: athleteId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  if (!athlete) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Athlete not found');
  }

  // Fetch the average rating score for the athlete
  const ratingData = await ratingService.getratingAvarage(athlete.userId);

  return {
    ...athlete,
    user: {
      ...athlete?.user,
      latitude: athlete?.user?.latitude,
      longitude: athlete?.user?.longitude,
    },
    averageRating: ratingData.average,
    ratingCount: ratingData.count,
  };
};

const getAthletes = async (
  paginationOptions: IPaginationOptions,
  params: Filters,
  userId?: string,
  minAge?: number,
  maxAge?: number,
  minHeight?: number,
  maxHeight?: number,
  minWeight?: number,
  maxWeight?: number,
  minDistance?: number,
  maxDistance?: number,
  userLatitude?: number,
  userLongitude?: number,
) => {
  const {
    page,
    limit,
    skip,
    sortBy = 'id',
    sortOrder = 'asc',
  } = calculatePagination(paginationOptions);

  const { search, ...restParams } = params;

  const andConditions: Prisma.AthleteWhereInput[] = [];

  if (userId) {
    andConditions.push({
      userId: { not: userId },
    });
  }

  if (search) {
    andConditions.push({
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { about: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (Object.keys(restParams).length) {
    andConditions.push({
      AND: Object.keys(restParams).map((key) => ({
        [key]: { equals: restParams[key] },
      })),
    });
  }

  // Apply age range filter
  if (minAge !== undefined || maxAge !== undefined) {
    andConditions.push({
      age: {
        gte: minAge !== undefined ? minAge : undefined,
        lte: maxAge !== undefined ? maxAge : undefined,
      },
    });
  }

  // Apply height range filter
  if (minHeight !== undefined || maxHeight !== undefined) {
    andConditions.push({
      height: {
        gte: minHeight !== undefined ? minHeight : undefined,
        lte: maxHeight !== undefined ? maxHeight : undefined,
      },
    });
  }

  // Apply weight range filter
  if (minWeight !== undefined || maxWeight !== undefined) {
    andConditions.push({
      weight: {
        gte: minWeight !== undefined ? minWeight : undefined,
        lte: maxWeight !== undefined ? maxWeight : undefined,
      },
    });
  }

  // Distance filtering based on user location
  if (minDistance && maxDistance && userLatitude && userLongitude) {
    andConditions.push({
      AND: [
        {
          user: {
            latitude: {
              gte: userLatitude - maxDistance,
              lte: userLatitude + maxDistance,
            },
          },
        },
        {
          user: {
            longitude: {
              gte: userLongitude - maxDistance,
              lte: userLongitude + maxDistance,
            },
          },
        },
      ],
    });

    const athletes = await prisma.athlete.findMany({
      select: {
        id: true,
        user: { select: { latitude: true, longitude: true } },
      },
    });

    const filteredAthletes = athletes.filter((athlete) => {
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        athlete.user.latitude as number,
        athlete.user.longitude as number,
      );
      return distance >= minDistance && distance <= maxDistance;
    });

    if (filteredAthletes.length > 0 && filteredAthletes[0].user) {
      andConditions.push({
        OR: [
          {
            user: {
              latitude: {
                gte: calculateDistance(
                  userLatitude,
                  userLongitude,
                  filteredAthletes[0].user.latitude as number,
                  filteredAthletes[0].user.longitude as number,
                ),
              },
            },
          },
        ],
      });
    }
  }

  // Validating sorting fields
  const validSortFields = [
    'id',
    'userId',
    'fighting',
    'martialArts',
    'experience',
    'gender',
    'country',
    'height',
    'weight',
    'about',
    'age',
    'winbyKO',
    'winbyOther',
    'wins',
    'losses',
    'draws',
    'titles',
    'reach',
    'fightingStances',
  ];

  if (!validSortFields.includes(sortBy)) {
    throw new Error(`Invalid sortBy field: ${sortBy}`);
  }

  // Fetching results and total count
  const [result, total] = await prisma.$transaction([
    prisma.athlete.findMany({
      where: { AND: andConditions.length > 0 ? andConditions : undefined },
      include: { user: true },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.athlete.count({
      where: { AND: andConditions.length > 0 ? andConditions : undefined },
    }),
  ]);

  // Fetch the average rating score for the athletes
  const ratingData = await Promise.all(
    result.map(async (athlete) => ({
      userId: athlete.userId,
      rating: await ratingService.getratingAvarage(athlete.userId),
    })),
  );

  // Pagination metadata
  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  // Return formatted data
  return {
    meta,
    data: result.map((athlete) => ({
      id: athlete.id,
      userId: athlete.userId,
      name: athlete.user.name,
      profileImage: athlete.user.profileImage,
      about: athlete.about,
      martialArts: athlete.martialArts,
      fighting: athlete.fighting,
      age: athlete.age,
      height: athlete.height,
      weight: athlete.weight,
      winbyKO: athlete.winbyKO,
      winbyOther: athlete.winbyOther,
      wins: athlete.wins,
      losses: athlete.losses,
      draws: athlete.draws,
      fightingStances: athlete.fightingStances,
      averageRating: ratingData.find(
        (rating) => rating.userId === athlete.userId,
      )?.rating.average,
      ratingCount: ratingData.find(
        (rating) => rating.userId === athlete.userId,
      ),
    })),
  };
};

const sendCoachRequest = async (athleteId: string, coachId: string) => {
  const [athlete, coach] = await prisma.$transaction([
    prisma.athlete.findUnique({
      where: {
        userId: athleteId,
      },
      include: {
        user: true,
      },
    }),
    prisma.coach.findUnique({
      where: {
        id: coachId,
      },
    }),
  ]);

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!coach) {
    throw new Error('Coach not found');
  }

  const existingRequest = await prisma.coachRequest.findUnique({
    where: {
      athleteId_coachId: {
        athleteId: athlete.id,
        coachId: coach.id,
      },
    },
  });

  if (existingRequest && existingRequest.status === JoinStatus.PENDING) {
    throw new Error('A pending request already exists');
  }

  const result = await prisma.coachRequest.create({
    data: {
      athleteId: athlete.id,
      coachId: coach.id,
      status: JoinStatus.PENDING,
    },
  });

  // Optionally, send a notification to the coach
  // const notificationBody: NotificationBody = {
  //   title: 'New Coach Request',
  //   body: `${athlete.user.name} has sent you a request to become their coach.`,
  // };
  // await notificationServices.sendSingleNotification({
  //   params: {
  //     userId: coach.userId,
  //   },
  //   body: notificationBody,
  // });

  return result;
};

const removeCoach = async (athleteId: string, coachRequestId: string) => {
  const [athlete, coachRequest] = await prisma.$transaction([
    prisma.athlete.findUnique({
      where: {
        id: athleteId,
      },
    }),
    prisma.coachRequest.findUnique({
      where: {
        id: coachRequestId,
      },
    }),
  ]);

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!coachRequest) {
    throw new Error('Coach Request not found');
  }

  const result = await prisma.coachRequest.delete({
    where: {
      id: coachRequestId,
    },
  });

  return result;
};

const sendGymJoinRequest = async (athleteId: string, gymId: string) => {
  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  const existingRequest = await prisma.gymMembership.findUnique({
    where: {
      athleteId_gymId: {
        athleteId: athlete.id,
        gymId: gymId,
      },
    },
  });

  if (existingRequest && existingRequest.status === JoinStatus.PENDING) {
    throw new Error('A pending request already exists');
  }

  const result = await prisma.gymMembership.create({
    data: {
      athleteId: athlete.id,
      gymId: gymId,
      status: JoinStatus.PENDING,
    },
  });

  // Optionally, send a notification to the gym owner
  // const notificationBody: NotificationBody = {
  //   title: 'New Gym Membership Request',
  //   body: `${athlete.user.name} has requested to join your gym.`,
  // };
  // await notificationServices.sendSingleNotification({
  //   params: {
  //     userId: gym.userId,
  //   },
  //   body: notificationBody,
  // });

  return result;
};
const cancelGymJoinRequest = async (athleteId: string, gymId: string) => {
  const [athlete, gym] = await prisma.$transaction([
    prisma.athlete.findUnique({
      where: {
        id: athleteId,
      },
    }),
    prisma.gym.findUnique({
      where: {
        id: gymId,
      },
    }),
  ]);

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!gym) {
    throw new Error('Gym not found');
  }

  const result = prisma.gymMembership.deleteMany({
    where: {
      userId: athleteId,
      gymId: gymId,
    },
  });

  return result;
};

const fetchAssignedCoaches = async (
  paginationOptions: IPaginationOptions,
  athleteId: string,
) => {
  const {
    page,
    limit,
    skip,
    sortBy = 'id',
    sortOrder,
  } = calculatePagination(paginationOptions);

  const athlete = await prisma.athlete.findUnique({
    where: {
      id: athleteId,
    },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }
  const whereConditions: Prisma.CoachRequestWhereInput = {
    athleteId: athleteId,
    status: JoinStatus.ACCEPTED,
  };

  const [result, total] = await prisma.$transaction([
    prisma.coachRequest.findMany({
      where: whereConditions,
      include: {
        coach: {
          select: {
            id: true,
            userId: true,
            certifications: true,
            country: true,
            age: true,
            martialArts: true,
            experience: true,
            bio: true,
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.coachRequest.count({
      where: whereConditions,
    }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return {
    meta,
    data: result,
  };
};

const fetchJoinedGyms = async (
  athleteId: string,
  paginationOptions: IPaginationOptions,
) => {
  const {
    page,
    limit,
    skip,
    sortBy = 'id',
    sortOrder,
  } = calculatePagination(paginationOptions);

  const athlete = await prisma.athlete.findUnique({
    where: {
      id: athleteId,
    },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  const whereConditions: Prisma.GymMembershipWhereInput = {
    athleteId: athleteId,
    status: 'ACCEPTED',
  };

  const [result, total] = await prisma.$transaction([
    prisma.gymMembership.findMany({
      where: whereConditions,
      include: {
        gym: true,
      },
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.gymMembership.count({
      where: whereConditions,
    }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return [
    meta,
    result.map((gym) => ({
      id: gym.id,
      country: gym.gym.country,
      location: gym.gym.location,
    })),
  ];
};

export const athleteService = {
  getAthlete,
  getAthletes,
  sendCoachRequest,
  removeCoach,
  sendGymJoinRequest,
  cancelGymJoinRequest,
  fetchAssignedCoaches,
  fetchJoinedGyms,
};

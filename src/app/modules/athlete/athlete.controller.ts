import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { athleteService } from './athlete.service';
import { pick } from '../../../helpars/pick';

const getAthlete = catchAsync(async (req, res) => {
  const { athleteId } = req.params;
  const athlete = await athleteService.getAthlete(athleteId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Athlete retrieved successfully',
    data: athlete,
  });
});

const getAthletes = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const page = parseInt(paginationOptions.page || '1', 10);
  const limit = parseInt(paginationOptions.limit || '10', 10);
  const skip = (page - 1) * limit;

  paginationOptions.page = page;
  paginationOptions.limit = limit;
  paginationOptions.skip = skip;

  const filter = pick(req.query, [
    'search',
    'martialArts',
    'fighting',
    'minAge',
    'maxAge',
    'minHeight',
    'maxHeight',
    'minWeight',
    'maxWeight',
    'gender',
    'minDistance',
    'maxDistance',
    'userLatitude',
    'userLongitude',
  ]);

  // Parsing min and max filters from the request
  const minAge = parseInt(filter.minAge, 10) || undefined;
  const maxAge = parseInt(filter.maxAge, 10) || undefined;
  const minHeight = parseInt(filter.minHeight, 10) || undefined;
  const maxHeight = parseInt(filter.maxHeight, 10) || undefined;
  const minWeight = parseInt(filter.minWeight, 10) || undefined;
  const maxWeight = parseInt(filter.maxWeight, 10) || undefined;
  const minDistance = parseInt(filter.minDistance, 10) || undefined;
  const maxDistance = parseInt(filter.maxDistance, 10) || undefined;
  const userLatitude = parseFloat(filter.userLatitude) || undefined;
  const userLongitude = parseFloat(filter.userLongitude) || undefined;

  [
    'minAge',
    'maxAge',
    'minHeight',
    'maxHeight',
    'minWeight',
    'maxWeight',
    'minDistance',
    'maxDistance',
    'userLatitude',
    'userLongitude',
  ].forEach((key) => delete filter[key]);

  const athletes = await athleteService.getAthletes(
    paginationOptions,
    filter,
    userId,
    minAge,
    maxAge,
    minHeight,
    maxHeight,
    minWeight,
    maxWeight,
    minDistance,
    maxDistance,
    userLatitude,
    userLongitude,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Athletes retrieved successfully',
    data: athletes,
  });
});

const sendCoachRequest = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { coachId } = req.params;
  console.log(athleteId, coachId);
  const data = await athleteService.sendCoachRequest(athleteId, coachId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coach assigned request sent successfully',
    data,
  });
});

const removeCoach = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { coachRequestId } = req.params;
  const data = await athleteService.removeCoach(athleteId, coachRequestId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coach Request removed successfully',
    data,
  });
});

const sendGymJoinRequest = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { gymId } = req.params;
  const data = await athleteService.sendGymJoinRequest(athleteId, gymId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gym join request sent successfully',
    data,
  });
});

const cancelGymJoinRequest = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { gymId } = req.params;

  const data = await athleteService.cancelGymJoinRequest(athleteId, gymId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gym join request cancelled successfully',
    data,
  });
});

const fetchAssignedCoaches = catchAsync(async (req, res) => {
  const athleteId = req.params.athleteId;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const page = parseInt(paginationOptions.page as string, 10) || 1;
  const limit = parseInt(paginationOptions.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  paginationOptions.page = page;
  paginationOptions.limit = limit;
  paginationOptions.skip = skip;

  const data = await athleteService.fetchAssignedCoaches(
    paginationOptions,
    athleteId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved assigned coach successfully',
    data,
  });
});

const fetchJoinedGyms = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const data = await athleteService.fetchJoinedGyms(
    athleteId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved joined gyms successfully',
    data,
  });
});

export const AthleteController = {
  getAthlete,
  getAthletes,
  sendCoachRequest,
  removeCoach,
  sendGymJoinRequest,
  cancelGymJoinRequest,
  fetchAssignedCoaches,
  fetchJoinedGyms,
};

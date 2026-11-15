import { Injectable, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import {
  Coordinates,
  UserTransportMethod,
  TravelRoute,
  ImpactCategoryInput,
  ImpactCategoryResult,
} from './openai.types';

// Route multipliers applied on top of the Haversine straight-line distance
// to approximate realistic travelable distance per transport method.
const ROUTE_MULTIPLIERS: Record<UserTransportMethod, number> = {
  [UserTransportMethod.TRAIN]: 1.2,
  [UserTransportMethod.AIRCRAFT]: 1.05,
  [UserTransportMethod.SEA]: 1.15,
};

const TRANSPORT_METHOD_LABELS: Record<UserTransportMethod, string> = {
  [UserTransportMethod.TRAIN]: 'Train',
  [UserTransportMethod.AIRCRAFT]: 'Aircraft',
  [UserTransportMethod.SEA]: 'Sea',
};

@Injectable()
export class OpenAIService {
  private readonly client: OpenAI;

  constructor(@Inject('OPENAI_OPTIONS') private readonly options: { apiKey: string }) {
    this.client = new OpenAI({ apiKey: options.apiKey });
  }

  /**
   * Computes the great-circle (straight-line) distance between two coordinates
   * using the Haversine formula. This is fully deterministic.
   */
  private haversineDistanceKm(origin: Coordinates, destination: Coordinates): number {
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(destination.latitude - origin.latitude);
    const dLon = toRad(destination.longitude - origin.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(origin.latitude)) *
        Math.cos(toRad(destination.latitude)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getTravelRoute(
    origin: Coordinates,
    destination: Coordinates,
    transportMethod: UserTransportMethod,
  ): Promise<TravelRoute> {
    const straightLineKm = Math.round(this.haversineDistanceKm(origin, destination));
    const methodLabel = TRANSPORT_METHOD_LABELS[transportMethod];
    const multiplier = ROUTE_MULTIPLIERS[transportMethod];
    const estimatedDistanceKm = Math.round(straightLineKm * multiplier);

    const prompt = `You are a logistics and geography expert. A user wants to transport goods between two locations using a specific transport method. Determine whether this transport method is feasible for the given route.

Origin: latitude ${origin.latitude}, longitude ${origin.longitude}
Destination: latitude ${destination.latitude}, longitude ${destination.longitude}
Straight-line distance: ${straightLineKm} km
Selected transport method: ${methodLabel}
Estimated travelable distance (if feasible): ${estimatedDistanceKm} km (straight-line × ${multiplier})

Determine whether travel via ${methodLabel} is physically possible and practical between these two locations.

Guidelines:
- Train: Feasible only when both locations are on the same landmass or continent connected by a rail network. Not feasible across oceans or when no rail infrastructure exists between the two points.
- Aircraft: Always feasible between any two locations in the world.
- Sea: Feasible when the route can use ocean, sea, river, or coastal waterways. Not feasible for purely landlocked routes with no navigable waterway connection.

Respond with a JSON object with these exact fields:
- isPossible: true if travel via ${methodLabel} is feasible, false if it is not
- routeDescription: a brief explanation of why the transport method is or is not feasible for this route`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      seed: 42,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content) as {
      isPossible: boolean;
      routeDescription: string;
    };

    const distanceKm = parsed.isPossible ? estimatedDistanceKm : 0;

    return {
      origin,
      destination,
      transportMethod,
      distanceKm,
      routeDescription: parsed.routeDescription,
    };
  }

  async calculateImpactCategoryData(input: ImpactCategoryInput): Promise<ImpactCategoryResult> {
    const prompt = `You are tasked with estimating the cradle-to-gate environmental impact data for a product based on the information provided below.

Product Information:
Comparison Product Category Description: [${input.comparisonProductDescription}]
Net Unit Size : [${input.productSize} ${input.productUnit}]

Objective:
Provide cradle-to-gate environmental impact data per unit of the product across the following categories:
Carbon Emissions (in kg CO₂-eq/unit)
Water Usage (in m3/unit)
Land Use (in m²/unit)

Requirements:
Prioritize data sources in the following order: [1] Ecoinvent 3.8, [2] European Commission PEFCR for Cosmetics (2021), [3] Carbon Trust, [4] peer-reviewed academic LCA studies.
If multiple values are found, report the range and calculate the midpoint.
Present one final value per impact category, based on the midpoint if applicable.
Exclude downstream packaging impacts unless packaging is explicitly included in the cradle-to-gate scope.
Assume "cradle-to-gate" only: from raw material extraction through production to factory gate (no distribution, use phase, or end-of-life impacts).
Always cite exact sources used, including year.
Perform all conversions as needed using appropriate ratios.

Units to Use:
Carbon Emissions: kg CO₂-eq/unit
Water Usage: m3/unit
Land Use: m²/unit

Output Format:
Respond with a JSON object with these exact fields:
{
  "carbonEmissions": {
    "value": <number>,
    "unit": "kg CO₂-eq/unit",
    "calculationSteps": "<string>",
    "sources": ["<string>"]
  },
  "waterUsage": {
    "value": <number>,
    "unit": "m3/unit",
    "calculationSteps": "<string>",
    "sources": ["<string>"]
  },
  "landUse": {
    "value": <number>,
    "unit": "m²/unit",
    "calculationSteps": "<string>",
    "sources": ["<string>"]
  }
}`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-5.4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as ImpactCategoryResult;
  }
}

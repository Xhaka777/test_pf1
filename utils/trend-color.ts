import { PositionColorEnum } from '@/api/schema';
import { PositionTypeEnum } from '@/shared/enums';

export function trendColor(value?: string | number): PositionColorEnum {
    if (!value) {
        return PositionColorEnum.FLAT;
    }
    if (typeof value === 'string') {
        if (value === PositionTypeEnum.LONG) return PositionColorEnum.LONG;
        if (value === PositionTypeEnum.SHORT) return PositionColorEnum.SHORT;
        return PositionColorEnum.FLAT;
    }

    if (value > 0) return PositionColorEnum.LONG;
    if (value < 0) return PositionColorEnum.SHORT;
    return PositionColorEnum.FLAT;
}

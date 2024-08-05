/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Model, ModelDictionary } from '@journalhub/model'

import { APIQueryResult } from '../types/APIResult'

export function generateQueryFixture<Type extends Model>(
    fixtures: { dictionary: ModelDictionary<Type>, list: Type[] }
): APIQueryResult<Type> {
    return {
        dictionary: fixtures.dictionary,
        list: fixtures.list.map((f) => f.id),
        meta: {
            count: fixtures.list.length,
            page: 1,
            pageSize: 20,
            numberOfPages: Math.floor(fixtures.list.length / 20) + (fixtures.list.length % 20 ? 1 : 0)
        },
        relations: {}
    }
}

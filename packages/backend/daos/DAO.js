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

export class DAO {

    constructor(core) {
        this.core = core
    }


    /**
     * @return Promise<void>
     */
    async insert(entityName, table, fieldMap, entities) {
        if ( ! Array.isArray(entities) ) {
            entities = [ entities ]
        }

        let columns = '('
        for (const [field, meta] of Object.entries(fieldMap)) {
            columns += ( columns == '(' ? '' : ', ') + field
        }

        if ( columns == '(' ) {
            throw new DAOError('missing-fields',
                `Empty field map sent to DAO::insert().`)
        }

        columns += ', created_date, updated_date)'

        let rows = ''
        let params = []
        for(const entity of entities) {
            let row = '('
            for(const [field, meta] of Object.entries(fieldMap)) {
                if ( meta.required && ! ( meta.key in entity ) ) {
                    throw new DAOError('missing-field',
                        `Required '${meta.key}' not found in ${entityName}.`)
                }

                params.push(( entity[meta.key] ? entity[meta.key] : null ))
                row += ( row == '(' ? '' : ', ') + `$${params.length}`
            }
            row += ', now(), now())'

            if ( rows !== '' ) {
                rows += ', ' + row
            } else {
                rows += row
            }
        }


        let sql = `
            INSERT INTO ${table} ${columns}
                VALUES ${rows}`

        await this.core.database.query(sql, params)
    }

    async update(entityName, table, fieldMap, entities) {


    }
}

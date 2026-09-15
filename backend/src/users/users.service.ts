import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class UsersService {
    findAll() {
        return [
            {
                id: 1, name: 'efrain,'
            }
        ]
    }

    findOne(id: string) {
        return [
            {
                id: 2, name: 'pepe'
            }
        ]
    }

    create(body: CreateUserDto) {
        return [
            {
                id: 3, name: 'pepe2', email: 'hlaluz59@gmail.com', password: 'jeje123'
            }
        ]
    }
}

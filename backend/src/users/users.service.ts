import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto'
import type { Repository } from 'typeorm';
import { User } from './entities/user.entity/user.entity';

@Injectable()
export class UsersService {
    private readonly userRepository: Repository<User>
    findAll() {
        return this.userRepository.find()
    }

    findOne(id: number) {
        return this.userRepository.findOne({where : {id}})
    }

    create(body: CreateUserDto) {
        return this.userRepository.save(body)
    }

    delete(id: number) {
        return this.userRepository.softDelete(id)
    }

    restore(id: number) {
        return this.userRepository.restore(id)
    }
}

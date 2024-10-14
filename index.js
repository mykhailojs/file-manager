import { resolve } from 'path';
import { readdir, readFile, writeFile, rename, copyFile, unlink } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createBrotliCompress, createBrotliDecompress } from 'zlib';
import readline from 'readline';
import { homedir, EOL, cpus, userInfo, arch } from 'os';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';
import { chdir, cwd } from 'process';


const params = process.argv.slice(2);


let username = 'User-default-name';

params.forEach(arg => {
    if (arg.startsWith('--username=')) {
        username = arg.split('=')[1];
    }
});

console.log(`Welcome to the File Manager, ${username}!`);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


const currentHomeDir = homedir();
chdir(currentHomeDir);


const setCurrentDirectory = () => {
    console.log(`You are currently in ${cwd()}`);
};


const cliManagement = async (input) => {
    const [type, ...params] = input.trim().split(' ');

    try {
        switch (type) {
            case '.exit':
                rl.close();
                break;
            case 'up':
                if (cwd() !== currentHomeDir) {
                    chdir('..');
                }
                break;
            case 'cd':
                if (params.length !== 1) {
                    console.log('Invalid input');
                } else {
                    const pathToCopy = resolve(cwd(), params[0]);
                    if (pathToCopy.startsWith(currentHomeDir)) {
                        await chdir(pathToCopy);
                    } else {
                        console.log('Operation failed');
                    }
                }
                break;
            case 'ls':
                const files = await readdir(cwd(), { withFileTypes: true });
                const folders = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
                const names = files.filter(dirent => dirent.isFile()).map(dirent => dirent.name);
                console.log('Folders:');
                folders.sort().forEach(folder => console.log(folder));
                console.log('Files:');
                names.sort().forEach(file => console.log(file));
                break;
            case 'cat':
                if (params.length !== 1) {
                    console.log('Invalid input');
                } else {
                    const pathToCat = resolve(cwd(), params[0]);
                    const data = await readFile(pathToCat, 'utf-8');
                    console.log(data);
                }
                break;
            case 'add':
                if (params.length !== 1) {
                    console.log('Invalid input');
                } else {
                    const pathToAdd = resolve(cwd(), params[0]);
                    await writeFile(pathToAdd, '');
                }
                break;
            case 'rn':
                if (params.length !== 2) {
                    console.log('Invalid input');
                } else {
                    const oldPath = resolve(cwd(), params[0]);
                    const newPath = resolve(cwd(), params[1]);
                    await rename(oldPath, newPath);
                }
                break;
            case 'cp':
                if (params.length !== 2) {
                    console.log('Invalid input');
                } else {
                    const fromPath = resolve(cwd(), params[0]);
                    const toPath = resolve(cwd(), params[1], params[0]);
                    await copyFile(fromPath, toPath);
                }
                break;
            case 'mv':
                if (params.length !== 2) {
                    console.log('Invalid input');
                } else {
                    const fromPath = resolve(cwd(), params[0]);
                    const tpPath = resolve(cwd(), params[1], params[0]);
                    await copyFile(fromPath, tpPath);
                    await unlink(fromPath);
                }
                break;
            case 'rm':
                if (params.length !== 1) {
                    console.log('Invalid input');
                } else {
                    const filePath = resolve(cwd(), params[0]);
                    await unlink(filePath);
                }
                break;
            case 'os':
                if (params.length !== 1) {
                    console.log('Invalid input');
                } else {
                    switch (params[0]) {
                        case '--EOL':
                            console.log(JSON.stringify(EOL));
                            break;
                        case '--cpus':
                            console.log(cpus());
                            break;
                        case '--homedir':
                            console.log(homedir());
                            break;
                        case '--username':
                            console.log(userInfo().username);
                            break;
                        case '--architecture':
                            console.log(arch());
                            break;
                        default:
                            console.log('Invalid input');
                    }
                }
                break;
            case 'hash':
                if (params.length !== 1) {
                    console.log('Invalid input');
                } else {
                    const filePath = resolve(cwd(), params[0]);
                    const hash = createHash('sha256');
                    const input = createReadStream(filePath);
                    input.pipe(hash).setEncoding('hex').on('finish', () => {
                        console.log(hash.read());
                    });
                }
                break;
            case 'compress':
                if (params.length !== 2) {
                    console.log('Invalid input');
                } else {
                    const fromPath = resolve(cwd(), params[0]);
                    const toPath = resolve(cwd(), params[1]);
                    try {
                        await pipeline(
                            createReadStream(fromPath),
                            createBrotliCompress(),
                            createWriteStream(toPath)
                        );
                        console.log('File compressed successfully');
                    } catch (error) {
                        console.log('Operation failed');
                    }
                }
                break;
            case 'decompress':
                if (params.length !== 2) {
                    console.log('Invalid input');
                } else {
                    const fromPath = resolve(cwd(), params[0]);
                    const toPath = resolve(cwd(), params[1]);
                    try {
                        await pipeline(
                            createReadStream(fromPath),
                            createBrotliDecompress(),
                            createWriteStream(toPath)
                        );
                        console.log('File decompressed successfully');
                    } catch (error) {
                        console.log('Operation failed');
                    }

                }
                break;
            default:
                console.log('Invalid input');
        }
    } catch (error) {
        console.log('Operation failed');
    }


    setCurrentDirectory();
};





setCurrentDirectory();

rl.on('line', (input) => {
    cliManagement(input);
});


rl.on('close', () => {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    process.exit(0);
});


process.on('SIGINT', () => {
    rl.close();
});

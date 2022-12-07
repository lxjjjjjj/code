
const getLastPatch = (params) => {
  const { Patch: PatchModel } = ctx.model
  const sql = `select pc.* from patch_tb pc left join status_tb s on pc.id = s.patch_id left join publish_tb pl on pl.id = s.publish_id where 
  pl.app_name = '${params.project_name}' and s.channel = '${params.channel}' and s.is_published = 1 and pc.is_rollback = 0 and pl.id = s.publish_id and pc.id = s.patch_id`
  try {
    const sqlResult: Array<any> = await ctx.model.query(sql, {
      model: PatchModel
    })
    const patch = sqlResult[sqlResult.length - 1] || {}
    return patch
  } catch(err) {
    throw new Error('没有最近的一次上线patch')
  }
}
const updateFileAddress = (params) => {
  const { Patch: PatchModel } = ctx.model
  let sqlFileAddress = {}
  try {
    const fileAddress = await PatchModel.findOne({
      attributes: ['file_address'],
      where: {
        id: params.patchId,
        channel: params.channel
      }
    })
    fileAddress?.file_address && (sqlFileAddress = JSON.parse(fileAddress.file_address))
    const newFileAddress = Object.assign(sqlFileAddress, params.file_address)
    await PatchModel.update({ file_address: JSON.stringify(newFileAddress) }, {
      where: {
        id: params.patchId
      }
    })
  } catch(e) {
    throw new Error(`更新patch中的file_address失败，${e}`)
  }
}
/**
 * 上线完成之后 删除未上线patch的质量检测文件
 * @params publish_id
 * @params 上线的patch_id
 */
const deleteUnCompleteFile(params) {
  const { ctx, app } = this
  const { Op } = app.Sequelize
  try {
    const patchList = await ctx.model.Patch.findAll({
      where: {
        publish_id: Number(params.publish_id),
        id: {
          [Op.not]: Number(params.patch_id)
        }
      },
      attributes: ['file_address', 'id']
    })
    const fileList = [] as Array<any>
    patchList.forEach(item => {
      const file_address = item.getDataValue('file_address')
      if (file_address && Object.keys(file_address)) {
        const fileAddress = JSON.parse(file_address)
        Object.keys(fileAddress).forEach(key => {
          const urlArray = fileAddress[key].split('/');
          fileAddress[key] = urlArray.slice(4, urlArray.length).join('/');
          fileList.push(fileAddress[key])
        })
        ctx.model.Patch.update({ file_address: JSON.stringify({}) }, {
          where: {
            id: item.getDataValue('id')
          }
        })
      }
    })
    const result = await ctx.service.gift.selectFileListAndDelete({ urlList: fileList })
    return result
  } catch(err) {
    throw new Error(JSON.stringify(err))
  }
}
const getOeNotice = () => {
  const { ctx, app } = this
  const { Op } = app.Sequelize
  const { isEmpty } = ctx.helper
  ctx.checkParams('get', {
    app_name: 'string',
    dist_url: 'string',
    commit_id: 'string',
    mode: ['wx', 'ali', 'xh', 'wx,ali', 'all'],
    result: 'string', // 0: 成功; 1: 失败
    oe_group_id: 'string?', // 产品ID
    oe_service_id: 'string?', // 服务ID
    oe_pipeline_id: 'string?', // 流水线id
    oe_pipeline_build_id: 'string?' // 流水线构建ID
  })
  const { app_name, commit_id, dist_url, mode: rawMode, result, oe_group_id, oe_service_id, oe_pipeline_id, oe_pipeline_build_id } = ctx.query
  try {
    const patch = await ctx.service.patch.getPatchByCommitIdOrDistUrl((rawMode === 'all' || rawMode === 'wx,ali') ? '' : rawMode, commit_id, '')
    if (!isEmpty(patch)) {
      const modes = patch.map((item: any) => {
        return item.getDataValue('channel')
      })
      const { flow_status } = patch[0]
      const ids = patch.map(item => {
        return { id: item.getDataValue('id') }
      })
      if (flow_status === 10) {
        // 当前patch处于初始状态，则只记录dist_url
        const distUrl = (+result === 1)
          ? JSON.stringify({ result: 1 })
          : dist_url
        await ctx.service.patch.setPatchField({
          dist_url: distUrl
        }, {
          where: {
            [Op.or]: ids
          }
        })
        ctx.sendSuccess({}, 'ok')
      } else if (+result === 1) {
        await ctx.service.patch.setPatchField({
          flow_status: 23,
          pipeline_ids: `${oe_group_id}/${oe_service_id}/${oe_pipeline_id}/${oe_pipeline_build_id}`
        }, {
          where: {
            [Op.or]: ids
          }
        })
        // app.io.of('/isFlowChange').emit('status', {
        //   errno: 0,
        //   errmsg: 'fail',
        //   data: {
        //     is_change: false
        //   }
        // })
        // app.io.of('/isFlowChange').emit('disconnect')
        ctx.service.patch.sendMessage({
          type: 20,
          project_name: app_name
        })
        ctx.sendSuccess({}, 'ok')
      } else if (flow_status === 21 || flow_status === 23) { // 等待中 || 已报错(重试)
        let aliId = 0
        if (modes.length > 1) {
          const aliP = patch.find(pt => pt.getDataValue('channel') === 'ali')
          aliId = aliP && aliP.getDataValue('id')
        }
        ctx.service.patch.sendMessage({
          type: 21,
          project_name: app_name
        })
        modes.forEach(m => {
          const p = patch.find(p => p.getDataValue('channel') === m)
          const aliNoGift = (m === 'ali' && modes.length > 1) // rawMode是 wx,ali 时，支付宝不上传gift
          ctx.service.ci.schedule({
            appName: app_name,
            patchId: p!.getDataValue('id'),
            distUrl: dist_url,
            channel: m,
            step: p!.getDataValue('is_quality') ? 9 : 3,
            aliPatchId: (m === 'wx' && aliId) ? aliId : 0,
            aliNoGift,
            isTry: false
          })
        })
        // app.io.of('/isFlowChange').emit('status', {
        //   errno: 0,
        //   errmsg: 'success',
        //   data: {
        //     is_change: true
        //   }
        // })
        ctx.sendSuccess({}, 'ok')
      } else {
        ctx.sendFail(1, '查询数据失败, 当前patch状态有误, flow_status: ' + flow_status + ', id: ' + JSON.stringify(ids))
      }
    } else {
      ctx.sendFail(1, '查询数据失败')
    }
  } catch (err) {
    console.error(err)
    // ctx.throw(err as Error)
    ctx.sendFail(1, err as string)
  }
}
export default class CiService extends Service {
  /**
   * ci重试
   * @param params
   */
  public async retry(params) {
    const { ctx } = this
    const { isEmpty } = ctx.helper
    const patchModel = ctx.model.Patch
    const { appName, patchId, channel, step, user_id } = params

    if (!step) throw new Error('step输入有误')

    const patch = await ctx.service.patch.getPatchInfo({ patch_id: patchId })
    if (!patch || isEmpty(patch)) throw new Error('patch_id有误: ' + patchId)

    const flowStatus = patch.getDataValue('flow_status')
    const flow = flowStatus / 10
    const status = flowStatus % 10
    if (status !== 3) throw new Error('当前状态有误')
    await patchModel.update({
      flow_status: flow + 1
    }, {
      where: {
        id: patchId
      }
    })

    if (step === 1) {
      const option = {
        patch,
        publish_id: patch.getDataValue('publish_id'),
        mpVersion: patch.getDataValue('mp_version'),
        comment: patch.getDataValue('comment'),
        project_name: appName,
        user_id
      }
      try {
        await this.doCommitMpVersion(option)
      } catch (e: any) {
        throw e
      }
    } else {
      this.schedule({
        appName,
        patchId,
        distUrl: patch.getDataValue('dist_url'),
        channel,
        step,
        isTry: true,
        user_id
      })
    }
  }
  /**
   * ci自动化操作
   * @param params
   */
  public schedule(params) {
    const { ctx, app } = this
    const { appName, patchId, distUrl, channel, step, aliPatchId, aliNoGift, isTry, user_id } = params
    const suffix = 'tar.gz'
    let patchData,
      storeDir,
      projectPath,
      unCompressingPath
      // sourceMapSavePath

    const setOperate = op => { // 写日志
      const o = {
        patch_id: patchId,
        channel,
        operate_source: 'system',
        operate_status: op.status,
        operate_content: op.message,
        flow: op.flow,
        create_time: Date.now()
      }
      ctx.service.operate.setOperate(o)
    }

    const prepareEnv = callback => { // 准备环境变量
      const writeLog = (status, message: string) => {
        setOperate({
          status,
          message,
          flow: step // 3: 代码上传 || 4: 生成sourceMap
        })
      }
      async.waterfall([
        callback => { // 设置dist_url值，将在重试时使用
          if (isTry) {
            callback(null)
          } else {
            const field = {
              dist_url: distUrl,
              flow_status: step * 10 + 1
            }
            this.setPatchField(patchId, field, callback)
          }
        },
        callback => { // 获取patch相关信息 project channel 相关信息
          // this.getDataById(patchId, callback)
        },
        (data, callback) => {
          patchData = data
          const { appName, defaultBranch } = data
          storeDir = path.join(ctx.app.config.storeDir, `${appName}/${defaultBranch}-${channel}`)
          // sourceMapSavePath = `./${appName}-${defaultBranch}-${channel}.zip`
          callback(null)
        },
        callback => { // 下载文件
          this.downBinaryFile(distUrl, storeDir, channel, suffix, writeLog, callback)
        },
        (compressPath, callback) => { // 解压
          this.decompression(compressPath, suffix, writeLog, callback)
        },
        (data, callback) => { // 上传zip包到gift && 修改库 code_origin 字段
          unCompressingPath = data
          projectPath = path.join(unCompressingPath, patchData.channelData.output_address)
          if (isTry) {
            callback(null)
          } else if (aliNoGift) {
            callback(null)
          } else { // 非重试场景，需要把zip包上传到gift
            let giftUrl = ''
            async.waterfall([
              callback => {
                const { appName, mpVersion } = patchData
                const filePath = storeDir + '/' + channel + '.' + suffix
                const fileName = `dist/${channel}_${mpVersion}.${suffix}`
                ctx.service.gift.uploadFile(filePath, fileName, appName, writeLog, callback)
              },
              (url, callback) => {
                aliPatchId && (giftUrl = url)
                const field = { code_origin: url }
                this.setPatchField2(patchId, field, callback)
              },
              callback => {
                if (aliPatchId) { // 传入条件: channel: wx，&& rawMode: wx,ali 时，才会传入该值，此时需要把上传的gift链接，也存到ali流水线(避免同一个文件重复上传到gift)
                  const field = {
                    id: aliPatchId,
                    code_origin: giftUrl
                  }
                  this.setPatchField(aliPatchId, field, callback)
                } else {
                  callback(null)
                }
              }
            ], err => {
              callback(err)
            })
          }
        },
        callback => { // 上传 size-report.json 功能待定
          if (patchData.size_report_address) {
            // const filePath = '',
            //   fileName = ''
            // ctx.service.gift.uploadFile(filePath, fileName, writeLog, callback)
            callback(null)
          } else {
            callback(null)
          }
        }
      ], err => {
        if (err) {
          callback({
            err,
            step,
            stage: 'prepare'
          })
        } else {
          callback(null)
        }
      })
    }

    const codeUpload = callback => { // 代码上传
      // const config = genConfig(channel)
      const writeLog = (status: StatusMap, message: string) => {
        setOperate({
          status,
          message,
          flow: 3
        })
      }
      if (!config) {
        callback(`[代码上传]: ${channel} 获取config失败`)
      } else {
        async.waterfall([
          callback => {
            const field = { flow_status: 31, is_sourcemap_jump: 0 }
            this.setPatchField(patchId, field, callback)
          },
          callback => {
            ctx.service.cis[channel].upload(config as any, writeLog, callback)
          },
          (url, callback) => {
            // sendDcMsg(url).catch(r => r)
            setOperate({
              message: 'dc 消息发送到群',
              status: 'info',
              flow: 3 // 3: 代码上传
            })
            callback(null, url)
          },
          (url, callback) => {
            const field = {
              qrcode_origin: url,
              patch_id: patchId,
              is_sourcemap_jump: 0
            }
            // 设置二维码图片路径
            // this.setQrcodeField(appName, channel, field, callback).then(r => r)
            ctx.service.patch.sendMessage({
              project_name: appName,
              type: 31
            })
          }
        ], err => {
          if (err) {
            callback({
              err,
              step: 3,
              stage: 'upload'
            })
          } else {
            callback(null)
          }
        })
      }
    }
    // const genSourceMap = callback => { // sourceMap上传
    //   const config = genConfig('wx') as WxOptionType
    //   Object.assign(config, {
    //     sourceMapSavePath
    //   })
    //   const writeLog = (status: StatusMap, message: string) => {
    //     setOperate({
    //       status,
    //       message,
    //       flow: 4
    //     })
    //   }
    //   writeLog('info', '进入生成sourceMap阶段')
    //   async.waterfall([
    //     callback => {
    //       const field = { flow_status: 41 }
    //       this.setPatchField(patchId, field, callback)
    //     },
    //     callback => {
    //       ctx.service.cis.wx.genSourceMap(config, writeLog, callback)
    //     },
    //     callback => {
    //       const { appName, mpVersion } = patchData
    //       const fileName = `sourcemap/${mpVersion}.zip`
    //       ctx.service.gift.uploadFile(sourceMapSavePath, fileName, appName, writeLog, callback)
    //     },
    //     (url, callback) => {
    //       const field = {
    //         sourcemap_origin: url,
    //         flow_status: 50
    //       }
    //       this.setPatchField(patchId, field, callback)
    //     }
    //   ], err => {
    //     if (err) {
    //       callback({
    //         err,
    //         step: 4,
    //         stage: 'sourcemap'
    //       })
    //     } else {
    //       callback(null)
    //     }
    //   })
    // }

    const codeQuality = async callback => { // 质量检测
      const writeLog = (status: StatusMap, message: string) => {
        setOperate({
          status,
          message,
          flow: 9
        })
      }
      try {
        const setConfig = await ctx.model.ProjectChannel.findOne({
          attributes: ['is_need_escheck',
            'is_escheck_suspend_process',
            'escheck_result_address',
            'is_dependency_redundance_check',
            'is_redundance_suspend_process',
            'redundance_result_address',
            'is_dependency_size_check',
            'is_size_suspend_process',
            'size_result_address'],
          where: {
            app_name: appName,
            channel
          }
        })
        const isSurplusCheck = !!setConfig?.getDataValue('is_dependency_redundance_check')
        const isSizeCheck = !!setConfig?.getDataValue('is_dependency_size_check')
        const isEsCheck = !!setConfig?.getDataValue('is_need_escheck')
        await ctx.model.Patch.update({ flow_status: 91 }, {
          where: {
            id: patchId
          }
        });
        const compileLogPath = `${unCompressingPath}/${setConfig?.getDataValue('redundance_result_address') || `output/${channel}_compileLog.json`}`
        const sizeReportPath = `${unCompressingPath}/${setConfig?.getDataValue('size_result_address') || `output/${channel}-size-report`}`
        const esCheckPath = `${unCompressingPath}/${setConfig?.getDataValue('escheck_result_address') || `output/${channel}-es-check.log`}`
        async.waterfall([
          // 冗余包检测
          callback => {
            isSurplusCheck ? this.surplusCheck(patchId, compileLogPath, channel, patchData.mpVersion, appName, writeLog, callback) : callback(null)
          },
          // 体积检测
          callback => {
            isSizeCheck ? this.sizeCheck(patchId, `${sizeReportPath}.json`, appName, suffix, channel, patchData.mpVersion, writeLog, callback) : callback(null)
          },
          // escheck检测
          callback => {
            isEsCheck ? this.escheck(patchId, esCheckPath, channel, patchData.mpVersion, appName, writeLog, callback) : callback(null)
          },
          // 质量检测结束
          callback => {
            (isEsCheck || isSizeCheck || isSurplusCheck) && this.quaityEnd(patchId, writeLog, setConfig, callback)
          }
        ], err => {
          if (err) {
            callback({
              err: JSON.stringify(err),
              step: 9,
              stage: 'quality'
            })
          } else {
            ctx.service.patch.sendMessage({
              project_name: appName,
              type: 91
            })
            callback(null, true)
          }
        })
      } catch (err) {
        writeLog('error', `[质量检测] ${JSON.stringify(err)}`)
      }
    }

    async.waterfall([
      callback => {
        prepareEnv(callback)
      },
      callback => { // 质量检测
        if (step === 9) {
          codeQuality(callback)
        } else {
          callback(null, true)
        }
      },
      (isQuality, callback) => { // 代码上传 生成qrcode
        if (step === 3 || isQuality) {
          codeUpload(callback)
        } else {
          callback(null)
        }
      },
      callback => { // 生成sourceMap
        if (channel === 'wx') {
          const field = { flow_status: 50, sourcemap_jump: 1 }
          this.setPatchField(patchId, field, callback)
          ctx.service.patch.sendMessage({
            project_name: appName,
            type: 41
          })
          // setOperate({
          //   status: 'info',
          //   message: '进入sourceMap阶段',
          //   flow: 4
          // })
          // genSourceMap(callback)
        } else {
          const field = { flow_status: 50 }
          this.setPatchField(patchId, field, callback)
        }
      }
    ], error => {
      if (error) {
        console.log('error', error)
        const { err, step } = error
        const field = { flow_status: step * 10 + 3 }
        const callback = () => {}
        this.setPatchField(patchId, field, callback)
        ctx.service.patch.sendMessage({
          project_name: appName,
          type: step * 10
        })
        setOperate({
          status: 'error',
          message: JSON.stringify(err),
          flow: step
        })
      }
    })
    ctx.sendSuccess(params)
  }

  /**
   * commit 到远程仓库
   * @param params
   */
  public async commitMpVersion(params: CommitMpVersionParam): Promise<{ error: any, data: any, messages: CiOperatorMessage[] }> {
    const { ctx } = this
    const { isEmpty } = ctx.helper
    const { mpVersion, comment, project_name, user_id, publish_id } = params
    if (!mpVersion) throw new Error('mpVersion 为空')

    const limit = await this.service.setting.getUserById(user_id)
    if (isEmpty(limit)) throw new Error('解析用户信息失败')
    const userName = limit!.user_name // getDataValue('user_name')
    const chineseName = limit!.chinese_name
    const userLimit = limit!.getDataValue('limit_type')
    if (userLimit === 0) throw new Error('抱歉，您无操作权限')

    const project = await ctx.service.home.getProject({ project_name })
    if (!project) return Promise.reject(new Error(`project_name:${project_name} 查询project信息失败`))

    const publish = await ctx.model.Publish.findOne({
      attributes: ['publish_branch'],
      where: {
        id: publish_id
      }
    })

    const messages: CiOperatorMessage[] = []
    const callback = (status: StatusMap, message: string) => {
      messages.push({ status, message })
    }
    const option = {
      projectId: project.getDataValue('git_project_id'),
      token: project.getDataValue('git_access_token'),
      branch: publish?.getDataValue('publish_branch') || project.getDataValue('publish_branch') || 'master',
      fieldKey: 'mpVersion',
      fieldVal: mpVersion,
      desc: comment,
      commitMessage: `create patch, mpVersion: ${mpVersion}, operator: ${userName}, chineseName: ${chineseName}`,
      onProgressUpdate: callback
    }
    const { error, data } = await ctx.service.git.index.commitPackByAppName(option)
    return { error, data, messages }
  }

  /**
   *
   * @param params
   * 返回commit_id 写入到两个patch里面，修改当前patch的status；
   * oe构建完毕后，其中一个patch OK后，判断当前状态，如果是在等待状态，则进入到下一个流程；如果是在初始化状态(10)，则只把dist_url保存下来
   * 当执行retryCIFlow init时，发现如果有dist_url，则不需要触发commit操作
   * 如果oe构建失败，修改dist_url为特定值
   */
  public async doCommitMpVersion(params: Obj) {
    const { ctx } = this
    let status
    let commitId = ''
    const updatePatch: any[] = []
    try {
      const { project_name, patch, mpVersion, comment, publish_id, user_id } = params
      // 执行的本函数就是正在进行时，为了保证前端的展示流程状态的正确性，这里设置一下进行时状态
      if (patch.id) {
        await ctx.model.Patch.update({
          flow_status: 11
        }, {
          where: {
            id: patch.id
          }
        })
      }
      const { error, data, messages } = await this.commitMpVersion({
        project_name,
        mpVersion,
        comment,
        user_id,
        publish_id
      })
      if (error) {
        status = 13 // 代码上传失败

        ctx.service.patch.sendMessage({
          project_name,
          type: 10
        })
        // app.io.of('/isFlowChange').emit('status', {
        //   errno: 0,
        //   errmsg: 'fail',
        //   data: {
        //     is_change: false
        //   }
        // })
        // app.io.of('/isFlowChange').emit('disconnect')
      } else {
        ctx.service.patch.sendMessage({
          project_name,
          type: 11
        })
        status = 21 // 代码上传成功 直接进入第二阶段 oe构建中...
        commitId = data.id
        // console.log('21212121')
        // app.io.of('/isFlowChange').emit('status', {
        //   errno: 0,
        //   errmsg: 'success',
        //   data: {
        //     is_change: true
        //   }
        // })
      }
      // 只修改当前patch的状态
      let mulPatch
      if (Array.isArray(patch)) {
        mulPatch = patch
        const arr: any[] = []
        patch.forEach(p => {
          arr.push({
            id: p.id,
            flow_status: status,
            commit_id: commitId
          })
        })
        for (let i = 0; i < arr.length; i++) {
          await ctx.model.Patch.update({
            flow_status: arr[i].flow_status,
            commit_id: arr[i].commit_id
          }, {
            where: {
              id: arr[i].id
            }
          })
        }
        // await ctx.model.Patch.bulkCreate(arr, { updateOnDuplicate: ['flow_status', 'commit_id'] })
      } else {
        await ctx.model.Patch.update({
          flow_status: status
        }, {
          where: {
            id: patch.id
          }
        })
        // 复用commit_id，同一个上线单下的mpVersion相同，则复用同一个commit_id
        mulPatch = await ctx.service.patch.getPatchByMpVersion(patch.mp_version, patch.publish_id)
        mulPatch = mulPatch || []
        mulPatch.forEach(p => {
          updatePatch.push({
            id: p.id,
            commit_id: commitId
          })
        })
        await ctx.model.Patch.bulkCreate(updatePatch, { updateOnDuplicate: ['commit_id'] })
      }

      const operateArr: OperateParam[] = []
      mulPatch.forEach(p => {
        messages.forEach(item => {
          operateArr.push({
            patch_id: p.id,
            channel: p.channel,
            operate_source: 'system',
            operate_status: item.status,
            operate_content: item.message,
            create_time: Date.now(),
            flow: 1,
            user_id
          })
        })
      })
      ctx.service.operate.mulSetOperate(operateArr)
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  /**
   * patch 设置patch某些字段
   * @param patchId
   * @param field
   * @param callback
   */
  public async setPatchField(patchId: number, field: Record<string, any>, callback: any) {
    const { ctx } = this
    const PathModel = ctx.model.Patch
    const flow_status = field.flow_status
    if (flow_status) {
      const flow = Math.floor(flow_status / 10)
      // const flowStatus = flow_status % 10
      await PathModel.update(field, {
        where: { id: patchId }
      })
      switch (flow) {
        case 1:
        case 2:
        case 3:
        case 4:
          // if (flowStatus === 3) {
          //   app.io.of('/isFlowChange').emit('status', {
          //     errno: 0,
          //     errmsg: 'fail',
          //     data: {
          //       is_change: false,
          //       flow: flow + flow_status
          //     }
          //   })
          //   app.io.of('/isFlowChange').emit('disconnect')
          // } else {
          //   app.io.of('/isFlowChange').emit('status', {
          //     errno: 0,
          //     errmsg: 'success',
          //     data: {
          //       is_change: true,
          //       flow: flow + flow_status
          //     }
          //   })
          // }
          break
        case 5:
          // if (flowStatus === 0) {
          //   app.io.of('/isFlowChange').emit('status', {
          //     errno: 0,
          //     errmsg: 'success',
          //     data: {
          //       is_change: false,
          //       flow: 50
          //     }
          //   })
          //   app.io.of('/isFlowChange').emit('disconnect')
          // }
          // break
      }
    }
    try {
      // if (flow_status) {
      //   const flow = Math.floor(flow_status / 10)
      //   const flowStatus = flow_status % 10
      //   await PathModel.update(field, {
      //     where: { id: patchId }
      //   })
      //   switch (flow) {
      //     case 1:
      //     case 2:
      //     case 3:
      //     case 4:
      //       if (flowStatus === 3) {
      //         app.io.of('/isFlowChange').emit('status', {
      //           errno: 0,
      //           errmsg: 'fail',
      //           data: {
      //             is_change: false,
      //             flow: flow + flow_status
      //           }
      //         })
      //         // app.io.of('/isFlowChange').emit('disconnect')
      //       } else {
      //         app.io.of('/isFlowChange').emit('status', {
      //           errno: 0,
      //           errmsg: 'success',
      //           data: {
      //             is_change: true,
      //             flow: flow + flow_status
      //           }
      //         })
      //       }
      //       break
      //     case 5:
      //       if (flowStatus === 0) {
      //         app.io.of('/isFlowChange').emit('status', {
      //           errno: 0,
      //           errmsg: 'success',
      //           data: {
      //             is_change: false,
      //             flow: 50
      //           }
      //         })
      //         // app.io.of('/isFlowChange').emit('disconnect')
      //       }
      //       break
      //   }
      // }
      // 这个是干啥的？
      callback(null)
    } catch (e) {
      console.log('------ ', e)
      callback(e)
    }
  }

  private async setPatchField2(patchId: number, field: Record<string, any>, callback: any) {
    const { ctx } = this
    const PathModel = ctx.model.Patch
    try {
      await PathModel.update(field, {
        where: { id: patchId }
      })
      callback(null)
    } catch (e) {
      console.log(e)
      callback(e)
    }
  }

  /**
   * qrcode 设置二维码图片路径
   * @param appName
   * @param channel
   * @param field
   * @param callback
   */
  public async setQrcodeField(appName: string, channel: string, field: Record<string, any>, callback: any) {
    const { ctx } = this
    const QrcodeModel = ctx.model.Qrcode
    try {
      await QrcodeModel.update(field, {
        where: {
          app_name: appName,
          channel
        }
      })
      callback(null)
    } catch (e) {
      callback(e)
    }
  }

  /**
   * 解压文件
   * @param comPath 项目中文件存放路径 `${storeDir}/${channel}/output/${channel}-size-report`
   * @param fileType
   * @param writeLog
   * @param callback
   * @private
   */
  private async decompression(comPath: string, fileType: string, writeLog: MessageWriteCallback, callback: any) {
    const fileTypeMap = {
      zip: {
        compressType: 'zip',
        dir: 'dist'
      },
      'tar.gz': {
        compressType: 'tgz',
        dir: 'output'
      }
    }
    try {
      const unCompressingPath = comPath.replace(`.${fileType}`, '')
      writeLog('info', `开始解压文件, 存放路径: ${unCompressingPath}`)
      await compressing[fileTypeMap[fileType].compressType].uncompress(comPath, unCompressingPath)
      writeLog('success', '解压成功')
      callback(null, unCompressingPath)
    } catch (e) {
      writeLog('error', JSON.stringify(e) as string)
      callback(e)
    }
  }

  /**
   * 下载二进制文件
   * @param url
   * @param storePath
   * @param mode
   * @param suffix
   * @param writeLog
   * @param callback
   * @private
   */
  private async downBinaryFile(url: string, storePath: string, mode: SupportChannel, suffix: string, writeLog: MessageWriteCallback, callback: any) {
    const { ctx, app } = this

    const checkDir = () => {
      if (!fs.existsSync(storePath)) {
        mkdirp.sync(storePath)
      } else {
        rimraf.sync(storePath + '/*')
      }
    }
    const option: CurlOptionsType = {
      dataType: 'arraybuffer',
      timeout: app.env === 'prod' ? 20 * 1000 : 120 * 1000 // 生成环境: 20s  测试环境: 120s
    }
    writeLog('info', `下载远程源代码: ${url}`)
    ctx
      .curl(url, option)
      .then(res => {
        if (res.status !== 200) return Promise.reject(res.res)
        checkDir()
        const writePath = `${storePath}/${mode}.${suffix}`
        fs.writeFileSync(writePath, res.data, 'binary')
        writeLog('success', `下载成功, 文件存放路径: ${writePath}`)
        callback(null, writePath)
      })
      .catch(err => {
        writeLog('error', `${JSON.stringify(err) as string}`)
        callback(err)
      })
  }
  /**
   * 质量检测-冗余包检测
   * @param url 上传到patch表的冗余包地址
   * @param patchId 流程中patchId
   * @param compileLogPath 项目中暂存的真实文件地址用于获取文件内容
   * @param callback
   */
  private async surplusCheck(patchId: number, compileLogPath: string, channel: SupportChannel, commitId: string, appName: string, writeLog: MessageWriteCallback, callback: any) {
    const { ctx } = this
    let multiVersions
    try{
      writeLog('info', '[质量检测]: 开始冗余包校验')
      const data = fs.readFileSync(compileLogPath, { encoding: 'utf8' })
      const deps = JSON.parse(data)?.deps
      if(data && deps) {
        // eslint-disable-next-line
        multiVersions = Object.entries(deps).map(([key, value]) => {
          const versions = (value as VersionValue).versions
          if(Array.isArray(versions) && (versions.length >= 2)) {
            return {
              versions: (versions as Array<string>).join(','),
              packageName: key
            }
          }
        }).filter(item => item)
      }
      const surplus_data = multiVersions.length
      if (surplus_data) {
        async.waterfall([
          callback => {
            ctx.service.gift.uploadFile(compileLogPath, `compileLog/${commitId}/${channel}_compileLog.json`, appName, writeLog, callback)
          },
          (url, callback) => {
            try{
              const file_address = {
                compileLog: url
              }
              ctx.service.patch.updateFileAddress({ patchId, file_address, channel })
              callback(null)
            } catch (err) {
              callback(err)
            }
          }
        ])
      }
      await ctx.model.Patch.update({ surplus_data }, {
        where: {
          id: patchId
        }
      });
      writeLog('success', `冗余包校验完成, 冗余包个数${surplus_data}`)
      callback(null)
    } catch(err) {
      writeLog('error', `[质量检测]: 冗余包校验失败, ${JSON.stringify(err)}`)
      callback(`冗余包检测错误, ${err}`)
    }
  }
  /**
   * 质量检测-包体积校验
   * @param url 上传到patch表的包体积检测地址
   * @param patchId 流程中patchId
   * @param sizeReportPath 项目中暂存的真实文件地址用于获取文件内容
   * @param appName 项目名称
   * @param suffix 解压文件后缀
   * @param channel 文件所属渠道
   * @param writeLog
   * @param callback
   */
  private async sizeCheck(patchId: number, sizeReportPath: string, appName: string, suffix: string, channel: SupportChannel, commitId: string, writeLog: MessageWriteCallback, callback: any) {
    const { ctx } = this
    // 上一次上线的patch文件存放路径目录
    const storeDir = path.join(ctx.app.config.storeDir, `${appName}/${channel}-last`)
    // 上一次上线的patch的sizeReport压缩文件存放路径
    const lastDistPathSizeReportPath = `${storeDir}/${channel}-size-report`
    // 上一次上线的patch的sizeReport文件的前缀
    const unCompressSizeReportPath = `${storeDir}/${channel}-size-report`
    try{
      writeLog('info', '[质量检测]: 开始体积校验')
      //  读取本次patch表的size_report 数据
      const data = fs.readFileSync(sizeReportPath, { encoding: 'utf8' })
      const sizeReportData = JSON.parse(data) as SizeReportData
      const finalData = {
        main: Number(sizeReportData.sizeSummary.sizeInfo.main.substring(0, sizeReportData.sizeSummary.sizeInfo.main.length - 3)),
        total: Number(sizeReportData.sizeSummary.totalSize.substring(0, sizeReportData.sizeSummary.totalSize.length - 3))
      }
      // 获取前一次上线patch的数据
      const lastPatch = await ctx.service.patch.getLastPatch({
        project_name: appName,
        channel
      })
      let finalLastData = {
        main: 0,
        total: 0
      }
      let last_size_report_path
      if(lastPatch && Object.keys(lastPatch).length) {
        // 如果前一次上线patch有file_address的sizeReport数据 那么下载json文件到文件中读取内容
        let last_size_report_url = ''
        lastPatch.file_address && (last_size_report_url = JSON.parse(lastPatch.file_address)?.sizeReport)
        last_size_report_path = last_size_report_url ? `${unCompressSizeReportPath}/${channel}/${channel}-size-report` : `${storeDir}/${channel}/output/${channel}-size-report`
        if(last_size_report_url) {
          await async.waterfall([
            callback => {
              // 下载上一次patch的压缩文件
              this.downBinaryFile(last_size_report_url, lastDistPathSizeReportPath, channel, 'tar.gz', writeLog, callback)
            },
            (compilepath, callback) => {
              console.log('compilepath', compilepath)
              // 解压上一次patch的压缩文件
              this.decompression(compilepath, 'tar.gz', writeLog, callback)
            }
          ])
        } else {
          // 如果上一次上线的patch没有sizeReport文件 那么拉取上一次上线patch的dist_url，并且把size_report文件上传 更新一下这个patch中的file_address数据
          const last_dist_url = lastPatch?.code_origin
          last_dist_url && await async.waterfall([
            callback => {
              // 先下载上一次patch的dist_url
              this.downBinaryFile(last_dist_url, storeDir, channel, suffix, writeLog, callback)
            },
            (compressPath, callback) => {
              // 然后解压
              this.decompression(compressPath, suffix, writeLog, callback)
            },
            (url, callback) => {
              // 然后将内存中的size_report文件压缩上传
              lastPatch?.commit_id && ctx.service.gift.uploadFileAndCompress(`${url}/output/${channel}-size-report`, `sizeReport/${lastPatch.commit_id}/${channel}-size-report`, 'tar.gz', appName, writeLog, callback)
            },
            (url, callback) => {
              // 将压缩的文件gift路径存在数据库中
              const file_address = {
                sizeReport: url
              }
              this.updatelastPatch(lastPatch.id, file_address, channel, callback)
            }
          ])
        }
        // 读取上一次patch的数据
        writeLog('info', '[质量检测]: 体积校验开始获取上一次上线的patch的体积分析数据')
        const lastSizeData = fs.readFileSync(`${last_size_report_path}.json`, { encoding: 'utf8' })
        const lastSizeReportData = JSON.parse(lastSizeData) as SizeReportData
        finalLastData = {
          main: Number(lastSizeReportData.sizeSummary.sizeInfo.main.substring(0, lastSizeReportData.sizeSummary.sizeInfo.main.length - 3)),
          total: Number(lastSizeReportData.sizeSummary.totalSize.substring(0, lastSizeReportData.sizeSummary.totalSize.length - 3))
        }
      } else {
        writeLog('error', '[质量检测]: 没有上线的Patch，体积分析不会对比上次体积')
      }
      // const compareData = {
      //   now: finalData,
      //   last: finalLastData,
      //   diff: {
      //     total: finalData.total - finalLastData?.total,
      //     main: finalData.main - finalLastData?.main
      //   }
      // }
      const allDiff = (finalData.total - finalLastData?.total).toFixed(2)
      const mainDiff = (finalData.main - finalLastData?.main).toFixed(2)
      const compareData = {
        result: Number(allDiff) > 0 || Number(mainDiff) > 0 ? 3 : 2,
        table: [
          {
            type: '总包',
            last: finalLastData.total + 'KB',
            now: finalData.total + 'KB',
            diff: allDiff + 'KB'
          },
          {
            type: '主包',
            last: finalLastData.main,
            now: finalData.main + 'KB',
            diff: mainDiff + 'KB'
          }
        ]
      }
      // 更新patch表size_report文件
      data && await ctx.model.Patch.update({ sizeReport_data: JSON.stringify(compareData) }, {
        where: {
          id: patchId
        }
      });
      if(compareData?.result === 3) {
        async.waterfall([
          callback => {
            ctx.service.gift.uploadFileAndCompress(`${last_size_report_path}`, `sizeReport/${commitId}/${channel}-size-report`, 'tar.gz', appName, writeLog, callback)
          },
          (url, callback) => {
            try {
              const file_address = {
                sizeReport: url
              }
              // 将本次patch文件的gift url 存在patch表里
              ctx.service.patch.updateFileAddress({ patchId, file_address, channel })
              callback(null)
            } catch(err) {
              callback(err)
            }
          }
        ])
      }
      writeLog('success', `[质量检测]: 体积校验完成，新增总体积为${allDiff},新增主包体积为${mainDiff}`)
      callback(null)
    } catch(err) {
      writeLog('error', `[质量检测]: 体积校验错误${JSON.stringify(err)}`)
      callback(`[质量检测]: 体积校验错误, ${err}`)
    }
  }
  /**
   * 质量检测结束-更改patch表的quality_end字段用来通知oe成功或者失败
   * @param patchId
   * @param writeLog
   * @param callback
   */
  private async quaityEnd(patchId: number, writeLog: MessageWriteCallback, setConfig: any, callback: any) {
    const { ctx } = this
    // 完全依赖质量检测结果的情况，其他情况都是质量检测成功不阻塞合并代码流程
    const dependEscheckRes = setConfig.getDataValue('is_need_escheck') && setConfig.getDataValue('is_escheck_suspend_process')
    const dependCompileRes = setConfig.getDataValue('is_dependency_redundance_check') && setConfig.getDataValue('is_redundance_suspend_process')
    console.log('quality', setConfig.getDataValue('is_redundance_suspend_process'), setConfig.getDataValue('is_dependency_redundance_check'))
    const dependSizeRes = setConfig.getDataValue('is_dependency_size_check') && setConfig.getDataValue('is_size_suspend_process')
    try {
      let parseSizeData:any = {}
      const patch = await ctx.model.Patch.findOne({
        where: {
          id: patchId
        }
      });
      const sizeData = patch?.sizeReport_data
      patch && sizeData && (parseSizeData = JSON.parse(sizeData))
      const esCheckCode = (dependEscheckRes && !patch?.esCheck_data) || !dependEscheckRes
      const CompileCode = (dependCompileRes && !patch?.surplus_data) || !dependCompileRes
      const sizeCode = (dependSizeRes && parseSizeData?.table?.[0]?.diff !== '0.00KB' && parseSizeData.table?.[1]?.diff !== '0.00KB') || !dependSizeRes
      const oeCode = esCheckCode && CompileCode && sizeCode ? 2 : 3
      await ctx.model.Patch.update({ quality_end: oeCode, flow_status: 9 * 10 + oeCode }, {
        where: {
          id: patchId
        }
      });
      if (oeCode === 2) {
        writeLog('success', '[质量检测]: 质量检测结束')
        callback(null)
      } else if (oeCode === 3) {
        console.log('[质量检测]: 质量检测结束失败')
        writeLog('error', '[质量检测]: 质量检测结束失败')
        callback({
          err: '[质量检测]: 质量检测结束失败',
          step: 9,
          stage: 'quality'
        })
      }
    } catch(err) {
      writeLog('error', `[质量检测]: 质量检测结束${JSON.stringify(err)}`)
      callback(err)
    }
  }
  /**
   * 下载gift的单个文件
   * @param url 下载文件的gift地址
   * @param storePath 文件内存的存储地址
   * @param writeLog 写进度
   */
  /**
   * 更新上一次patch的fileAddress
   * @param patchId
   * @param file_address
   * @param channel
   * @param callback
   */
  private async updatelastPatch(patchId: number, file_address: any, channel: SupportChannel, callback: any) {
    const { ctx } = this
    try {
      await ctx.service.patch.updateFileAddress({ patchId, file_address, channel })
      callback(null)
    } catch(err) {
      callback(err)
    }
  }
  private async escheck(patchId: number, esCheckPath: string, channel: string, commitId: string, appName: string, writeLog: MessageWriteCallback, callback: any) {
    const { ctx } = this
    try {
      const data = fs.existsSync(esCheckPath) ? fs.readFileSync(esCheckPath, { encoding: 'utf8' }) : ''
      if(data) {
        writeLog('error', '[质量检测]: escheck校验失败')
        async.waterfall([
          callback => {
            ctx.service.gift.uploadFile(esCheckPath, `esCheck/${commitId}/${channel}-es-check.log`, appName, writeLog, callback)
          },
          (url, callback) => {
            try {
              const file_address = {
                esCheck: url || ''
              }
              ctx.service.patch.updateFileAddress({ patchId, file_address, channel })
              callback(null)
            } catch (err) {
              callback(err)
            }
          }
        ])
      } else {
        fs.existsSync(esCheckPath) && writeLog('success', '[质量检测]: escheck校验成功')
      }
      const esCheckData = data ? 1 : 2
      console.log('esCheckData', esCheckData)
      await ctx.model.Patch.update({ esCheck_data: esCheckData }, {
        where: {
          id: patchId
        }
      });
      callback(null)
    } catch(err) {
      if (err) {
        writeLog('error', `[质量检测]: escheck校验失败 ${JSON.stringify(err)}`)
        callback(`[质量检测]: escheck校验失败 ${err}`)
      } else {
        callback(null)
      }
    }
  }
}

```

上传代码

```
public async uploadFile(filePath: string, fileName: string, appName: string, writeLog: MessageWriteCallback, callback: any) {
    const { app } = this
    const { config, formatDate } = app
    const prefix = '[gift 文件上传]'
    const {
      s3Host,
      accessKey,
      secretKey,
      bucket
    } = config.gift
    const s3Client = new Minio.Client({
      endPoint: s3Host,
      accessKey,
      secretKey
    })
    if(!fs.existsSync(filePath)) {
      callback(new Error(`不存在文件${filePath}`))
      return
    }
    const fileStream = fs.createReadStream(filePath)
    const time = formatDate(new Date()).format('YYYY-MM')
    fileName = `${appName}/${time}/${fileName}`
    fs.promises.stat(filePath).then(stat => {
      s3Client.putObject(bucket, fileName, fileStream, stat.size, metaData, (e, etag) => {
        if (e) {
          writeLog('error', `${prefix} 文件上传失败; filePath: ${filePath}; error: ${e}`)
          callback(e)
        } else {
          const url = `https://${s3Host}/${bucket}/${fileName}`
          writeLog('success', `${prefix} 文件上传成功; url: ${url} etag: ${etag.etag}`)
          callback(null, url)
        }
      })
    }, e => {
      // writeLog('error', `${prefix} 文件读取失败; filePath: ${filePath}; error: ${e}`)
      callback(e)
    })
  }
```

微信生成preview代码
```
import { Service } from 'egg'
import * as ci from 'miniprogram-ci'

function startTimer(cb: () => void, delay: number, writeLog: any) {
  writeLog('info', '启动定时 ' + delay + 'ms')
  const timer = setTimeout(() => {
    writeLog('info', 'timer 执行')
    cb()
  }, delay)
  return () => {
    writeLog('info', '清除定时 ' + timer)
    clearTimeout(timer)
  }
}

export default class wx extends Service {
  async preview(options: WxOptionType) {
    const {
      appId,
      projectPath,
      privateKey,
      qrcodeOutputDest,
      qrcodeFormat = 'image',
      desc,
      pagePath,
      searchQuery,
      scene,
      version
    } = options
    const prefix = '[微信ci创建二维码]'
    const onProgressUpdate = (message: string) => message
    try {
      onProgressUpdate(`${prefix}: init project`)
      const project = new ci.Project({
        appid: appId,
        type: 'miniProgram',
        projectPath,
        privateKey
      })
      onProgressUpdate(`${prefix}: start exec ci.preview`)
      await ci.preview({
        project,
        qrcodeFormat,
        qrcodeOutputDest,
        desc,
        pagePath,
        searchQuery,
        scene: +scene!,
        version: version!
      })
      onProgressUpdate(`${prefix}: ci.preview exec success`)
    } catch (e: any) {
      onProgressUpdate(`${prefix}: ci.preview error: ${e.toString()}`)
      throw e
    }
  }
  async upload(options: WxOptionType, writeLog: MessageWriteCallback, callback: any) {
    const {
      appId,
      projectPath,
      privateKey,
      version,
      desc,
      robot,
      qrcode
    } = options
    const prefix = '[微信ci上传代码]'
    try {
      writeLog('info', `${prefix}: init project`)
      const project = new ci.Project({
        appid: appId,
        type: 'miniProgram',
        projectPath,
        privateKey
      })
      writeLog('info', `${prefix}: start exec ci.upload`)
      await ci.upload({
        project,
        useCOS: true,
        version: version!,
        desc,
        robot,
        onProgressUpdate: () => {}
      })
      writeLog('success', `${prefix}: ci.upload exec success`)
      callback(null, qrcode)
    } catch (e: any) {
      writeLog('error', `${prefix}: ci.upload error: ${e.toString()}`)
      callback(e)
      // throw e
    }
  }
  async genSourceMap(options: WxOptionType, writeLog: MessageWriteCallback, callback: any) {
    const {
      appId,
      projectPath,
      privateKey,
      sourceMapSavePath,
      robot
    } = options
    const prefix = '[微信ci拉取最近上传版本的sourceMap]'
    const clearTimer = startTimer(() => {
      writeLog('error', `${prefix}: 生成sourceMap超时`)
      callback('生成sourceMap超时')
    }, 60 * 1000, writeLog)
    try {
      writeLog('info', `${prefix}: init project`)
      const project = new ci.Project({
        appid: appId,
        type: 'miniProgram',
        projectPath,
        privateKey
      })
      writeLog('info', `${prefix}: start exec ci.getDevSourceMap`)
      ci.getDevSourceMap({
        project,
        robot: robot!,
        sourceMapSavePath: sourceMapSavePath!
      }).then(() => {
        clearTimer()
        writeLog('success', `${prefix}: ci.getDevSourceMap exec success`)
        callback(null)
      }).catch((err: any) => {
        clearTimer()
        writeLog('error', `${prefix}: 获取sourceMap失败: ${err.toString()}`)
        callback(err)
      })
    } catch (e: any) {
      clearTimer()
      throw e
    }
  }
}

